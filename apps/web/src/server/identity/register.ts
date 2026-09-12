import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { isValidTaxId, onlyDigits, type DocumentType } from "@saas-frota/shared";
import { env } from "../env";
import { db } from "../db";
import { ApiError } from "../http/respond";
import { newId } from "../ids";
import { createSession } from "../authz/session";
import { taxIdLast4 } from "../authz/mask";
import { cnpjRegistryPort } from "../ports/cnpj-registry";

export type RegisterInput = {
  email: string;
  password: string;
  nome: string;
  document_type: DocumentType;
  document_digits: string;
  whatsapp?: string;
  tenantSlug?: string;
  /** Extra client fields are ignored (role, prices, etc). */
  saas_role?: unknown;
  startSession?: boolean;
};

export type RegisterResult = {
  user_id: string;
  tenant_id: string;
  document_type: DocumentType;
  cnpj_registro_pendente: boolean;
  aviso?: string;
};

export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  const slug = input.tenantSlug || env.defaultTenantSlug;
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new ApiError("nao_encontrado", "Tenant não encontrado.");

  if (input.document_type === "cpf" && !tenant.aceitaCpf) {
    throw new ApiError("validacao", "Este tenant não aceita CPF.");
  }
  if (input.document_type === "cnpj" && !tenant.aceitaCnpj) {
    throw new ApiError("validacao", "Este tenant não aceita CNPJ.");
  }

  const digits = onlyDigits(input.document_digits);
  if (!isValidTaxId(input.document_type, digits)) {
    console.warn("register_checksum_invalido", {
      tenant_id: tenant.id,
      type: input.document_type,
      last4: taxIdLast4(digits),
    });
    throw new ApiError("checksum_invalido", "Documento com dígitos verificadores inválidos.");
  }

  let cnpjRegistroPendente = false;
  let razaoSocial: string | undefined;
  let aviso: string | undefined;
  if (input.document_type === "cnpj") {
    const lookup = await cnpjRegistryPort.lookup(digits);
    if (lookup.ok) {
      razaoSocial = lookup.razaoSocial;
    } else {
      cnpjRegistroPendente = true;
      aviso =
        lookup.reason === "not_found"
          ? "CNPJ não encontrado no registro público. Cadastro feito com pendência."
          : "Não foi possível consultar o CNPJ no registro público. Cadastro feito com pendência.";
      console.warn("cnpj_registro_pendente", {
        tenant_id: tenant.id,
        last4: taxIdLast4(digits),
        reason: lookup.reason,
      });
    }
  }

  const email = input.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = newId("usr");

  try {
    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email,
          passwordHash,
          nome: input.nome.trim(),
          whatsapp: input.whatsapp?.trim() || null,
        },
      });
      await tx.membership.create({
        data: {
          id: newId("mem"),
          tenantId: tenant.id,
          userId,
          saasRole: null,
          accountOwner: false,
          isCustomer: true,
        },
      });
      await tx.customerProfile.create({
        data: {
          id: newId("cpf"),
          tenantId: tenant.id,
          userId,
          documentType: input.document_type,
          documentDigits: digits,
          documentLast4: digits.slice(-4),
          cnpjRegistroPendente,
          razaoSocial: razaoSocial ?? null,
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError("validacao", "E-mail ou documento já cadastrado.");
    }
    throw err;
  }

  if (input.startSession !== false) {
    await createSession({ userId, tenantId: tenant.id, surface: "loja" });
  }

  return {
    user_id: userId,
    tenant_id: tenant.id,
    document_type: input.document_type,
    cnpj_registro_pendente: cnpjRegistroPendente,
    aviso,
  };
}
