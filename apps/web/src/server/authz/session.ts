import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { SaasRole, Surface } from "@saas-frota/shared";
import { db } from "../db";
import { env } from "../env";
import { ApiError } from "../http/respond";

export const SESSION_COOKIE: Record<Surface, string> = {
  loja: "sf_sessao_loja",
  saas: "sf_sessao_saas",
  conta: "sf_sessao_conta",
};

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionContext = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  surface: Surface;
  saasRole: SaasRole | null;
  accountOwner: boolean;
  isCustomer: boolean;
  subscriptionStatus: "ativa" | "inadimplente" | "cancelada";
  documentType?: "cpf" | "cnpj";
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(input: {
  userId: string;
  tenantId: string;
  surface: Surface;
}) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      id: randomBytes(12).toString("hex"),
      tokenHash: hashToken(token),
      userId: input.userId,
      tenantId: input.tenantId,
      surface: input.surface,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE[input.surface], token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(surface: Surface) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE[surface])?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token), surface } });
  }
  jar.delete(SESSION_COOKIE[surface]);
}

export async function readSession(surface: Surface): Promise<SessionContext | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE[surface])?.value;
  if (!token) return null;
  const row = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      tenant: true,
      user: { include: { memberships: true, customerOf: true } },
    },
  });
  if (!row || row.surface !== surface || row.expiresAt < new Date()) return null;
  const membership = row.user.memberships.find((m) => m.tenantId === row.tenantId);
  if (!membership) return null;
  const profile = row.user.customerOf.find((p) => p.tenantId === row.tenantId);
  return {
    userId: row.userId,
    tenantId: row.tenantId,
    tenantSlug: row.tenant.slug,
    surface,
    saasRole: membership.saasRole,
    accountOwner: membership.accountOwner,
    isCustomer: membership.isCustomer,
    subscriptionStatus: row.tenant.subscriptionStatus,
    documentType: profile?.documentType,
  };
}

export async function requireSession(surface: Surface): Promise<SessionContext> {
  const session = await readSession(surface);
  if (!session) throw new ApiError("unauthenticated", "Sessão inválida ou expirada.");
  return session;
}

export async function loginSurface(input: {
  surface: Surface;
  email: string;
  password: string;
  tenantSlug?: string;
}) {
  const slug = input.tenantSlug || env.defaultTenantSlug;
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { memberships: true },
  });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new ApiError("unauthenticated", "E-mail ou senha inválidos.");
  }
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new ApiError("nao_encontrado", "Tenant não encontrado.");
  const membership = user.memberships.find((m) => m.tenantId === tenant.id);
  if (!membership) throw new ApiError("forbidden", "Sem acesso a este tenant.");

  if (input.surface === "loja" && !membership.isCustomer) {
    throw new ApiError("forbidden", "Esta conta não é de cliente da loja.");
  }
  if (input.surface === "saas" && !membership.saasRole) {
    throw new ApiError("forbidden", "Esta conta não tem papel no SaaS.");
  }
  if (input.surface === "conta" && !membership.accountOwner) {
    throw new ApiError("forbidden", "Apenas o dono da conta acessa Conta.");
  }

  await createSession({ userId: user.id, tenantId: tenant.id, surface: input.surface });
  return { userId: user.id, tenantId: tenant.id, saasRole: membership.saasRole };
}
