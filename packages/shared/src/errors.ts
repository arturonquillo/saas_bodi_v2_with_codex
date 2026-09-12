export const API_ERROR_CODES = [
  "unauthenticated",
  "forbidden",
  "entitlement_bloqueada",
  "nao_encontrado",
  "transicao_ilegal",
  "estoque_insuficiente",
  "conflito",
  "validacao",
  "checksum_invalido",
  "moq_atacado",
  "arquivo_grande",
  "tipo_arquivo",
  "rate_limit",
  "nao_implementado",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const HTTP_FOR_CODE: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  entitlement_bloqueada: 403,
  nao_encontrado: 404,
  transicao_ilegal: 409,
  estoque_insuficiente: 409,
  conflito: 409,
  validacao: 422,
  checksum_invalido: 422,
  moq_atacado: 422,
  arquivo_grande: 413,
  tipo_arquivo: 415,
  rate_limit: 429,
  nao_implementado: 501,
};
