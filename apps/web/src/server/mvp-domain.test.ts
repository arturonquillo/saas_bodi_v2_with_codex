import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { availableQty } from "@saas-frota/shared";
import { db } from "./db";
import { ApiError } from "./http/respond";
import { registerCustomer } from "./identity/register";
import { lookupCnpj } from "./identity/cnpj-lookup";
import { setCnpjRegistryPortForTests } from "./ports/cnpj-registry";
import { createOrder } from "./orders/create";
import { transitionOrder } from "./orders/transition";
import { getSaasOrder, listSaasOrders } from "./orders/queries";
import { getStoreCatalog, getStoreProduct } from "./modules/catalog/projection";
import { adjustOnHand, toggleVisibilidade } from "./inventory/service";
import { confirmImport, createPreview } from "./import/service";
import { updateConfig } from "./config/service";
import { catchApi, createWorld, destroyWorld, sessionOf, type TestWorld } from "./test/world";

let a: TestWorld;
let b: TestWorld;

beforeAll(async () => {
  a = await createWorld("a");
  b = await createWorld("b");
});

afterAll(async () => {
  setCnpjRegistryPortForTests(null);
  if (a) await destroyWorld(a);
  if (b) await destroyWorld(b);
});

describe("store projection", () => {
  it("hides SKUs with visivel_loja=false and computes available from the single ledger", async () => {
    const page = await getStoreCatalog(a.slug, { limit: 50 });
    const codes = page.items.map((i) => i.sku);
    expect(codes).toContain(`VIS-${"a"}`);
    expect(codes).not.toContain(`HID-a`);
    const vis = page.items.find((i) => i.id === a.skus.visivel)!;
    expect(vis.available).toBe(availableQty(40, 5));
    expect(vis.available).toBe(35);
    const out = page.items.find((i) => i.id === a.skus.esgotado)!;
    expect(out.available).toBe(0);
    expect(out.sem_estoque).toBe(true);
  });

  it("404s hidden PDP", async () => {
    const err = await catchApi(() => getStoreProduct(a.skus.oculto, a.slug));
    expect(err).toBeInstanceOf(ApiError);
    expect(err?.code).toBe("nao_encontrado");
  });
});

describe("tenant isolation", () => {
  it("cannot read or transition the other tenant's order (same 404 as missing)", async () => {
    const order = await createOrder({
      session: sessionOf(b, "vendedor"),
      channel: "saas",
      customerUserId: b.users.customerCpf,
      linhas: [{ sku_id: b.skus.visivel, qty: 1 }],
    });
    const errGet = await catchApi(() => getSaasOrder(sessionOf(a, "supervisor"), order.id));
    expect(errGet?.code).toBe("nao_encontrado");
    expect(errGet?.message).toBe("Não encontrado.");
    const before = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: b.skus.visivel } });
    const errTx = await catchApi(() =>
      transitionOrder(sessionOf(a, "supervisor"), order.id, "confirmado"),
    );
    expect(errTx?.code).toBe("nao_encontrado");
    const balance = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: b.skus.visivel } });
    expect(balance.reserved).toBe(before.reserved);
    expect(balance.onHand).toBe(before.onHand);
  });

  it("store create cannot place an order as another customer (same 404)", async () => {
    const err = await catchApi(() =>
      createOrder({
        session: sessionOf(a, "customer"),
        channel: "loja",
        customerUserId: a.users.customerCnpj,
        linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
      }),
    );
    expect(err?.code).toBe("nao_encontrado");
  });

  it("saas create cannot attach another tenant's customer", async () => {
    const err = await catchApi(() =>
      createOrder({
        session: sessionOf(a, "vendedor"),
        channel: "saas",
        customerUserId: b.users.customerCpf,
        linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
      }),
    );
    expect(err?.code).toBe("nao_encontrado");
  });
});

describe("orders + stock machine", () => {
  it("freezes catalog price and ignores client unit_price / role", async () => {
    const order = await createOrder({
      session: sessionOf(a, "customer"),
      channel: "loja",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 2 }],
      unit_price: 1,
      saas_role: "supervisor",
    });
    expect(order.status).toBe("novo");
    expect(order.linhas[0]?.unit_price_centavos).toBe(5990);
    expect(order.price_list).toBe("varejo");
  });

  it("rejects hidden SKU on store checkout", async () => {
    const err = await catchApi(() =>
      createOrder({
        session: sessionOf(a, "customer"),
        channel: "loja",
        customerUserId: a.users.customerCpf,
        linhas: [{ sku_id: a.skus.oculto, qty: 1 }],
      }),
    );
    expect(err?.code).toBe("nao_encontrado");
  });

  it("enforces MOQ for CNPJ / atacado", async () => {
    const err = await catchApi(() =>
      createOrder({
        session: sessionOf(a, "vendedor"),
        channel: "saas",
        customerUserId: a.users.customerCnpj,
        linhas: [{ sku_id: a.skus.moq, qty: 2 }],
      }),
    );
    expect(err?.code).toBe("moq_atacado");
  });

  it("reserves on confirm, releases on cancel, consumes on dispatch", async () => {
    const before = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    const order = await createOrder({
      session: sessionOf(a, "vendedor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 3 }],
    });
    const midCreate = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(midCreate.reserved).toBe(before.reserved);

    await transitionOrder(sessionOf(a, "vendedor"), order.id, "confirmado");
    const reserved = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(reserved.reserved).toBe(before.reserved + 3);
    expect(reserved.onHand).toBe(before.onHand);

    await transitionOrder(sessionOf(a, "supervisor"), order.id, "separando");
    await transitionOrder(sessionOf(a, "estoquista"), order.id, "despachado");
    const consumed = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(consumed.onHand).toBe(before.onHand - 3);
    expect(consumed.reserved).toBe(before.reserved);

    const movements = await db.inventoryMovement.findMany({ where: { orderId: order.id } });
    expect(movements.map((m) => m.type).sort()).toEqual(["consume", "reserve"]);
  });

  it("releases reserve when canceling before dispatch", async () => {
    const before = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    const order = await createOrder({
      session: sessionOf(a, "vendedor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
    });
    await transitionOrder(sessionOf(a, "vendedor"), order.id, "confirmado");
    await transitionOrder(sessionOf(a, "vendedor"), order.id, "cancelado");
    const after = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(after.reserved).toBe(before.reserved);
    expect(after.onHand).toBe(before.onHand);
  });

  it("409 estoque_insuficiente when confirm would over-reserve", async () => {
    const order = await createOrder({
      session: sessionOf(a, "vendedor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
    });
    const snapshot = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    await db.inventoryBalance.update({
      where: { skuId: a.skus.visivel },
      data: { reserved: snapshot.onHand },
    });
    const err = await catchApi(() => transitionOrder(sessionOf(a, "vendedor"), order.id, "confirmado"));
    expect(err?.code).toBe("estoque_insuficiente");
    const bal = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(bal.reserved).toBe(snapshot.onHand);
    expect(bal.onHand).toBe(snapshot.onHand);
    const outbox = await db.notificationOutbox.count({
      where: { orderId: order.id, payloadJson: { contains: '"status":"confirmado"' } },
    });
    expect(outbox).toBe(0);
    await db.inventoryBalance.update({
      where: { skuId: a.skus.visivel },
      data: { reserved: snapshot.reserved, onHand: snapshot.onHand },
    });
  });

  it("writes customer+seller outbox rows per enabled channel", async () => {
    const order = await createOrder({
      session: sessionOf(a, "vendedor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
    });
    await transitionOrder(sessionOf(a, "vendedor"), order.id, "confirmado");
    const rows = await db.notificationOutbox.findMany({
      where: { orderId: order.id, payloadJson: { contains: '"status":"confirmado"' } },
    });
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.status === "enviado")).toBe(true);
    const keys = rows.map((r) => `${r.channel}:${r.recipientRole}`).sort();
    expect(keys).toEqual(["email:customer", "email:seller", "whatsapp:customer", "whatsapp:seller"]);
  });
});

describe("RBAC transitions", () => {
  it("role-illegal transition is 403 and has no stock/outbox side effects", async () => {
    const before = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    const order = await createOrder({
      session: sessionOf(a, "vendedor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
    });
    await transitionOrder(sessionOf(a, "vendedor"), order.id, "confirmado");
    const afterConfirm = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    const outboxBefore = await db.notificationOutbox.count({ where: { orderId: order.id } });

    const err = await catchApi(() =>
      transitionOrder(sessionOf(a, "vendedor"), order.id, "separando"),
    );
    expect(err?.code).toBe("forbidden");

    const after = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(after.reserved).toBe(afterConfirm.reserved);
    expect(after.onHand).toBe(before.onHand);
    const outboxAfter = await db.notificationOutbox.count({ where: { orderId: order.id } });
    expect(outboxAfter).toBe(outboxBefore);
    const still = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(still.status).toBe("confirmado");
  });

  it("state-illegal transition is 409", async () => {
    const order = await createOrder({
      session: sessionOf(a, "supervisor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
    });
    const err = await catchApi(() =>
      transitionOrder(sessionOf(a, "supervisor"), order.id, "entregue"),
    );
    expect(err?.code).toBe("transicao_ilegal");
  });

  it("warehouse queue hides novo orders", async () => {
    const order = await createOrder({
      session: sessionOf(a, "vendedor"),
      channel: "saas",
      customerUserId: a.users.customerCpf,
      linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
    });
    const list = await listSaasOrders(sessionOf(a, "estoquista"), { limit: 100, cursor: null });
    expect(list.items.some((i) => i.id === order.id)).toBe(false);
    const err = await catchApi(() => getSaasOrder(sessionOf(a, "estoquista"), order.id));
    expect(err?.code).toBe("nao_encontrado");
  });
});

describe("entitlement", () => {
  it("blocks store checkout and SaaS writes when not ativa", async () => {
    await db.tenant.update({ where: { id: a.tenantId }, data: { subscriptionStatus: "inadimplente" } });
    const blocked = sessionOf(a, "vendedor", { subscriptionStatus: "inadimplente" });
    const customer = sessionOf(a, "customer", { subscriptionStatus: "inadimplente" });
    const errStore = await catchApi(() =>
      createOrder({
        session: customer,
        channel: "loja",
        customerUserId: a.users.customerCpf,
        linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
      }),
    );
    expect(errStore?.code).toBe("entitlement_bloqueada");
    const errSaas = await catchApi(() =>
      createOrder({
        session: blocked,
        channel: "saas",
        customerUserId: a.users.customerCpf,
        linhas: [{ sku_id: a.skus.visivel, qty: 1 }],
      }),
    );
    expect(errSaas?.code).toBe("entitlement_bloqueada");
    const errAdj = await catchApi(() =>
      adjustOnHand(sessionOf(a, "supervisor", { subscriptionStatus: "inadimplente" }), a.skus.visivel, 10, "x"),
    );
    expect(errAdj?.code).toBe("entitlement_bloqueada");
    await db.tenant.update({ where: { id: a.tenantId }, data: { subscriptionStatus: "ativa" } });
  });
});

describe("identity", () => {
  it("rejects invalid CPF checksum", async () => {
    const err = await catchApi(() =>
      registerCustomer({
        email: `bad.${a.slug}@test.local`,
        password: "Demo@1234",
        nome: "Bad",
        document_type: "cpf",
        document_digits: "11111111111",
        tenantSlug: a.slug,
        startSession: false,
      }),
    );
    expect(err?.code).toBe("checksum_invalido");
  });

  it("ignores client saas_role on register", async () => {
    const created = await registerCustomer({
      email: `role.${a.slug}@test.local`,
      password: "Demo@1234",
      nome: "Cliente",
      document_type: "cpf",
      document_digits: "52998224725",
      tenantSlug: a.slug,
      saas_role: "supervisor",
      startSession: false,
    });
    const mem = await db.membership.findUniqueOrThrow({
      where: { tenantId_userId: { tenantId: a.tenantId, userId: created.user_id } },
    });
    expect(mem.saasRole).toBeNull();
    expect(mem.isCustomer).toBe(true);
  });

  it("CNPJ degrade path: checksum ok, registry down → cnpj_registro_pendente", async () => {
    setCnpjRegistryPortForTests({
      async lookup() {
        return { ok: false, reason: "unavailable" };
      },
    });
    const created = await registerCustomer({
      email: `deg.${a.slug}@test.local`,
      password: "Demo@1234",
      nome: "Empresa",
      document_type: "cnpj",
      document_digits: "11222333000181",
      tenantSlug: a.slug,
      startSession: false,
    });
    expect(created.cnpj_registro_pendente).toBe(true);
    const profile = await db.customerProfile.findUniqueOrThrow({
      where: { tenantId_userId: { tenantId: a.tenantId, userId: created.user_id } },
    });
    expect(profile.cnpjRegistroPendente).toBe(true);
    const lookup = await lookupCnpj("11222333000181");
    expect(lookup.cnpj_registro_pendente).toBe(true);
    setCnpjRegistryPortForTests(null);
  });
});

describe("inventory import + visibility + config", () => {
  it("preview does not apply; confirm writes absolute on_hand; invalid rows skipped", async () => {
    const before = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    const csv = [
      "sku,nome,quantidade,preco_varejo",
      `VIS-a,Visivel Atualizado,12,59.90`,
      "NOVO-SKU,Peça nova,7,10.00",
      ",sem sku,3,1.00",
    ].join("\n");
    const preview = await createPreview(sessionOf(a, "supervisor"), {
      bytes: new TextEncoder().encode(csv),
      filename: "estoque.csv",
    });
    const mid = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(mid.onHand).toBe(before.onHand);
    expect(preview.rows.some((r) => r.action === "error")).toBe(true);

    const result = await confirmImport(sessionOf(a, "supervisor"), preview.preview_id);
    expect(result.applied).toBe(2);
    expect(result.skipped.length).toBeGreaterThanOrEqual(1);
    const after = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.visivel } });
    expect(after.onHand).toBe(12);
    const created = await db.sku.findFirst({ where: { tenantId: a.tenantId, codigo: "NOVO-SKU" } });
    expect(created).toBeTruthy();
    const createdBal = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: created!.id } });
    expect(createdBal.onHand).toBe(7);
  });

  it("visivel_loja toggle does not change on_hand", async () => {
    const before = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.oculto } });
    const updated = await toggleVisibilidade(sessionOf(a, "supervisor"), a.skus.oculto, true);
    expect(updated.visivel_loja).toBe(true);
    const after = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: a.skus.oculto } });
    expect(after.onHand).toBe(before.onHand);
    expect(after.reserved).toBe(before.reserved);
  });

  it("config cannot leave both document flags false", async () => {
    const err = await catchApi(() =>
      updateConfig(sessionOf(a, "supervisor"), {
        aceita_cpf: false,
        aceita_cnpj: false,
        canais_aviso: "email",
      }),
    );
    expect(err?.code).toBe("conflito");
  });
});
