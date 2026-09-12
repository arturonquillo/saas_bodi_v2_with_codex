export const MOVEMENT_TYPES = ["reserve", "release", "consume", "adjust", "import_apply"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const IMPORT_COLUMNS = [
  "sku",
  "nome",
  "quantidade",
  "preco_varejo",
  "preco_atacado",
  "qtd_min_atacado",
  "visivel_loja",
] as const;

export const IMPORT_HEADER_SYNONYMS: Record<string, (typeof IMPORT_COLUMNS)[number]> = {
  sku: "sku",
  código: "sku",
  codigo: "sku",
  produto: "nome",
  nome: "nome",
  qtd: "quantidade",
  quantidade: "quantidade",
  preço: "preco_varejo",
  preco: "preco_varejo",
  preco_varejo: "preco_varejo",
  preco_atacado: "preco_atacado",
  qtd_min_atacado: "qtd_min_atacado",
  visivel_loja: "visivel_loja",
};
