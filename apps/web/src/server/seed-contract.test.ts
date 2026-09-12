import { describe, expect, it } from "vitest";
import { db } from "./db";

describe("seed contract demo", () => {
  it("matches docs/architecture/seed.md when demo tenant exists", async () => {
    const tenant = await db.tenant.findUnique({ where: { slug: "demo" }, include: { theme: true } });
    if (!tenant) return;

    expect(tenant.nome).toBe("Norte Atacado");
    expect(tenant.aceitaCpf).toBe(true);
    expect(tenant.aceitaCnpj).toBe(true);
    expect(tenant.canaisAviso).toBe("ambos");
    expect(tenant.subscriptionStatus).toBe("ativa");
    expect(tenant.planDisplayName).toBe("Plano Demo");
    expect(tenant.theme?.marca).toBe("Norte Atacado");
    expect(tenant.theme?.primary).toBe("#0F4F3E");

    const emails = [
      "dono@demo.local",
      "supervisora@demo.local",
      "vendedor@demo.local",
      "estoque@demo.local",
      "entregador@demo.local",
      "cliente.cpf@demo.local",
      "cliente.cnpj@demo.local",
    ];
    for (const email of emails) {
      expect(await db.user.findUnique({ where: { email } })).toBeTruthy();
    }

    const skus = await db.sku.findMany({ where: { tenantId: tenant.id } });
    const codes = skus.map((s) => s.codigo);
    expect(codes).toEqual(expect.arrayContaining(["CAMISETA-BASICA", "KIT-ATACADO-10", "OCULTO-INTERNO", "ESGOTADO-VITRINE"]));
    expect(skus.find((s) => s.codigo === "OCULTO-INTERNO")?.visivelLoja).toBe(false);
    expect(skus.find((s) => s.codigo === "KIT-ATACADO-10")?.qtdMinAtacado).toBe(10);

    const statuses = await db.order.findMany({ where: { tenantId: tenant.id } });
    expect(new Set(statuses.map((o) => o.status))).toEqual(
      new Set(["novo", "confirmado", "separando", "despachado", "entregue", "cancelado"]),
    );

    const camiseta = skus.find((s) => s.codigo === "CAMISETA-BASICA")!;
    const esgotado = skus.find((s) => s.codigo === "ESGOTADO-VITRINE")!;
    const balCam = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: camiseta.id } });
    const balEsg = await db.inventoryBalance.findUniqueOrThrow({ where: { skuId: esgotado.id } });
    expect(balCam.onHand).toBe(50);
    expect(balCam.reserved).toBe(5);
    expect(balEsg.onHand).toBe(2);
    expect(balEsg.reserved).toBe(2);
  });
});
