import bcrypt from "bcryptjs";
import type { SaasRole } from "@saas-frota/shared";
import type { SessionContext } from "../authz/session";
import { db } from "../db";
import { newId } from "../ids";

const PASSWORD = "Demo@1234";
let passwordHash: string | null = null;

async function hash() {
  passwordHash ??= await bcrypt.hash(PASSWORD, 8);
  return passwordHash;
}

export type TestWorld = {
  tenantId: string;
  slug: string;
  users: {
    supervisor: string;
    vendedor: string;
    estoquista: string;
    entregador: string;
    customerCpf: string;
    customerCnpj: string;
  };
  skus: {
    visivel: string;
    oculto: string;
    esgotado: string;
    moq: string;
  };
};

export function sessionOf(
  world: TestWorld,
  role: SaasRole | "customer",
  extras: Partial<SessionContext> = {},
): SessionContext {
  const userId =
    role === "customer"
      ? world.users.customerCpf
      : role === "supervisor"
        ? world.users.supervisor
        : role === "vendedor"
          ? world.users.vendedor
          : role === "estoquista"
            ? world.users.estoquista
            : world.users.entregador;
  return {
    userId,
    tenantId: world.tenantId,
    tenantSlug: world.slug,
    surface: role === "customer" ? "loja" : "saas",
    saasRole: role === "customer" ? null : role,
    accountOwner: false,
    isCustomer: role === "customer",
    subscriptionStatus: "ativa",
    documentType: role === "customer" ? "cpf" : undefined,
    ...extras,
  };
}

export async function createWorld(label: string): Promise<TestWorld> {
  const passwordHash = await hash();
  const tenantId = newId(`t_${label}`);
  const slug = `iso-${label}-${tenantId.slice(-6)}`;
  const users = {
    supervisor: newId("u"),
    vendedor: newId("u"),
    estoquista: newId("u"),
    entregador: newId("u"),
    customerCpf: newId("u"),
    customerCnpj: newId("u"),
  };
  const skus = {
    visivel: newId("sku"),
    oculto: newId("sku"),
    esgotado: newId("sku"),
    moq: newId("sku"),
  };

  await db.user.createMany({
    data: [
      { id: users.supervisor, email: `sup.${slug}@test.local`, passwordHash, nome: "Sup" },
      {
        id: users.vendedor,
        email: `ven.${slug}@test.local`,
        passwordHash,
        nome: "Ven",
        whatsapp: "+5511999000002",
      },
      { id: users.estoquista, email: `est.${slug}@test.local`, passwordHash, nome: "Est" },
      { id: users.entregador, email: `ent.${slug}@test.local`, passwordHash, nome: "Ent" },
      {
        id: users.customerCpf,
        email: `cpf.${slug}@test.local`,
        passwordHash,
        nome: "CPF",
        whatsapp: "+5511999000001",
      },
      {
        id: users.customerCnpj,
        email: `cnpj.${slug}@test.local`,
        passwordHash,
        nome: "CNPJ",
        whatsapp: "+5511999000003",
      },
    ],
  });

  await db.tenant.create({
    data: {
      id: tenantId,
      slug,
      nome: `Tenant ${label}`,
      aceitaCpf: true,
      aceitaCnpj: true,
      canaisAviso: "ambos",
      defaultSellerUserId: users.vendedor,
      subscriptionStatus: "ativa",
      planDisplayName: "Plano Teste",
    },
  });
  await db.theme.create({
    data: {
      tenantId,
      marca: "Teste",
      primary: "#0F4F3E",
      accent: "#C2410C",
      background: "#F6EFE3",
      logoUrl: null,
    },
  });
  await db.membership.createMany({
    data: [
      { id: newId("m"), tenantId, userId: users.supervisor, saasRole: "supervisor", isCustomer: false },
      { id: newId("m"), tenantId, userId: users.vendedor, saasRole: "vendedor", isCustomer: false },
      { id: newId("m"), tenantId, userId: users.estoquista, saasRole: "estoquista", isCustomer: false },
      { id: newId("m"), tenantId, userId: users.entregador, saasRole: "entregador", isCustomer: false },
      { id: newId("m"), tenantId, userId: users.customerCpf, saasRole: null, isCustomer: true },
      { id: newId("m"), tenantId, userId: users.customerCnpj, saasRole: null, isCustomer: true },
    ],
  });
  await db.customerProfile.createMany({
    data: [
      {
        id: newId("cp"),
        tenantId,
        userId: users.customerCpf,
        documentType: "cpf",
        documentDigits: label === "a" ? "39053344705" : "15350946056",
        documentLast4: label === "a" ? "4705" : "6056",
      },
      {
        id: newId("cp"),
        tenantId,
        userId: users.customerCnpj,
        documentType: "cnpj",
        documentDigits: label === "a" ? "11444777000161" : "00000000000191",
        documentLast4: label === "a" ? "0161" : "0191",
      },
    ],
  });
  await db.sku.createMany({
    data: [
      {
        id: skus.visivel,
        tenantId,
        codigo: `VIS-${label}`,
        nome: "Visivel",
        precoVarejoCentavos: 5990,
        precoAtacadoCentavos: 3990,
        qtdMinAtacado: 1,
        visivelLoja: true,
      },
      {
        id: skus.oculto,
        tenantId,
        codigo: `HID-${label}`,
        nome: "Oculto",
        precoVarejoCentavos: 1000,
        precoAtacadoCentavos: 800,
        qtdMinAtacado: 1,
        visivelLoja: false,
      },
      {
        id: skus.esgotado,
        tenantId,
        codigo: `OUT-${label}`,
        nome: "Esgotado",
        precoVarejoCentavos: 8900,
        precoAtacadoCentavos: 7000,
        qtdMinAtacado: 1,
        visivelLoja: true,
      },
      {
        id: skus.moq,
        tenantId,
        codigo: `MOQ-${label}`,
        nome: "Atacado MOQ",
        precoVarejoCentavos: 19900,
        precoAtacadoCentavos: 14900,
        qtdMinAtacado: 10,
        visivelLoja: true,
      },
    ],
  });
  await db.inventoryBalance.createMany({
    data: [
      { skuId: skus.visivel, tenantId, onHand: 40, reserved: 5 },
      { skuId: skus.oculto, tenantId, onHand: 20, reserved: 0 },
      { skuId: skus.esgotado, tenantId, onHand: 2, reserved: 2 },
      { skuId: skus.moq, tenantId, onHand: 80, reserved: 0 },
    ],
  });

  return { tenantId, slug, users, skus };
}

export async function destroyWorld(world: TestWorld) {
  await db.tenant.delete({ where: { id: world.tenantId } }).catch(() => undefined);
  await db.user.deleteMany({
    where: {
      OR: [
        { id: { in: Object.values(world.users) } },
        { email: { contains: `${world.slug}@test.local` } },
      ],
    },
  });
}

export async function catchApi(fn: () => Promise<unknown>) {
  try {
    await fn();
    return null;
  } catch (err) {
    return err as { code?: string; message?: string };
  }
}
