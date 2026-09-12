export type CnpjRegistryResult =
  | { ok: true; razaoSocial: string }
  | { ok: false; reason: "not_found" | "unavailable" };

export type CnpjRegistryPort = {
  lookup: (cnpjDigits: string) => Promise<CnpjRegistryResult>;
};

export type OutboxChannel = "email" | "whatsapp";

export type OutboxTransportPort = {
  send: (row: {
    id: string;
    channel: OutboxChannel;
    recipient: string;
    templateKey: string;
    payload: unknown;
  }) => Promise<void>;
};

export type CanonicalImportRow = {
  sku: string;
  nome?: string;
  quantidade: number;
  preco_varejo_centavos?: number;
  preco_atacado_centavos?: number;
  qtd_min_atacado?: number;
  visivel_loja?: boolean;
};

export type InventoryFileParsePort = {
  parse: (input: {
    bytes: Uint8Array;
    filename: string;
    instruction?: string;
  }) => Promise<{
    rows: Array<CanonicalImportRow | { error: string; raw: unknown }>;
  }>;
};
