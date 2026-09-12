# Ports

Adapters the backend fills. Product forbids silently replacing stubs with unpaid provider integrations.

Interfaces live in `packages/shared` (types) and `apps/web/src/server/ports/` (impl). Domain code depends on the interface only.

## CNPJ registry

Checksum (módulo 11) **always** runs in-process (`@saas-frota/shared` `isValidCnpj` / `isValidCpf`). The registry is extra.

```ts
type CnpjRegistryResult =
  | { ok: true; razaoSocial: string }
  | { ok: false; reason: "not_found" | "unavailable" };

interface CnpjRegistryPort {
  lookup(cnpjDigits: string): Promise<CnpjRegistryResult>;
}
```

Recommended live adapter: [BrasilAPI CNPJ](https://brasilapi.com.br/api/cnpj/v1/{cnpj}) with a short timeout (3s).

| Outcome | Registration |
|---|---|
| checksum fail | 422 `checksum_invalido` — stop |
| registry ok | save profile; `cnpj_registro_pendente = false`; store `razao_social` |
| not_found or timeout/5xx | checksum already passed → allow register; **warn** in UX; `cnpj_registro_pendente = true` |

`CNPJ_REGISTRY_ENABLED=false` (default local): adapter returns `unavailable` so the degrade path is demonstrable. Tests inject a mock port; they still must run checksum.

Rate-limit `POST /api/identidade/cnpj` per IP.

Never log the CNPJ digits passed into the port (hash or last4 only).

## Notification outbox

```ts
type OutboxChannel = "email" | "whatsapp";

interface OutboxTransportPort {
  send(row: { id: string; channel: OutboxChannel; recipient: string; templateKey: string; payload: unknown }): Promise<void>;
}
```

MVP `StubOutboxTransport`: mark the row `enviado` without calling Meta or SMTP.

On every **successful** status change (same transaction as history):

1. Resolve tenant `canais_aviso`.
2. Insert outbox rows for **customer** and **seller**.
3. If `ambos`, two channels each (four rows). If `email` or `whatsapp`, one channel each (two rows).
4. After commit, adapter may flip `pendente` → `enviado`.

Warehouse and courier are not recipients. Payload includes order id + new status — **no full tax ID**.

## File parse (AI inventory)

Not an agent platform. No executing spreadsheets.

```ts
type CanonicalImportRow = {
  sku: string;
  nome?: string;
  quantidade: number; // absolute on_hand
  preco_varejo_centavos?: number;
  preco_atacado_centavos?: number;
  qtd_min_atacado?: number;
  visivel_loja?: boolean;
};

interface InventoryFileParsePort {
  parse(input: { bytes: Uint8Array; filename: string; instruction?: string }): Promise<{
    rows: Array<CanonicalImportRow | { error: string; raw: unknown }>;
  }>;
}
```

Header synonyms (deterministic, required): `código`/`codigo`/`sku`, `produto`/`nome`, `qtd`/`quantidade`, `preço`/`preco`/`preco_varejo`, `preco_atacado`, `qtd_min_atacado`, `visivel_loja`.

Optional later: one LLM remap when a key is configured. Product does not require a live model. MVP ships the deterministic mapper.

Apply path:

1. `POST /api/saas/importacoes` → parse → persist batch `preview` + row actions (`create` / `update` / `error`) → return `preview_id`.
2. Nothing hits `inventory_balances` yet.
3. `POST /api/saas/importacoes/:id/confirmar` is the **only** apply. Transaction: valid rows apply absolute `quantidade`; invalid rows reported and skipped.
4. Discard / navigate away → batch `discarded`, ledger unchanged.

Accept `text/csv` and XLSX. Reject other MIME types. Cap size (e.g. 2 MB). Never `eval` or run macros.
