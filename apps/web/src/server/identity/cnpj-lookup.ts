import { isValidCnpj, onlyDigits } from "@saas-frota/shared";
import { ApiError } from "../http/respond";
import { taxIdLast4 } from "../authz/mask";
import { cnpjRegistryPort } from "../ports/cnpj-registry";

export async function lookupCnpj(raw: string) {
  const digits = onlyDigits(raw);
  if (!isValidCnpj(digits)) {
    console.warn("cnpj_lookup_checksum", { last4: taxIdLast4(digits) });
    throw new ApiError("checksum_invalido", "CNPJ com dígitos verificadores inválidos.");
  }
  const result = await cnpjRegistryPort.lookup(digits);
  if (result.ok) {
    return {
      ok: true as const,
      razao_social: result.razaoSocial,
      cnpj_registro_pendente: false,
    };
  }
  return {
    ok: false as const,
    cnpj_registro_pendente: true,
    reason: result.reason,
    aviso:
      result.reason === "not_found"
        ? "CNPJ não encontrado no registro público."
        : "Registro público indisponível. Você pode cadastrar com pendência após o checksum.",
  };
}
