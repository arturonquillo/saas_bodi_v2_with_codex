# Folder ownership

Frontend and backend implement in parallel against these contracts. Do not invent a second path for the same concept.

| Path | Owner | Others |
|---|---|---|
| `docs/product/` | product | read-only |
| `docs/design/` | design | frontend consumes tokens; do not fork names |
| `docs/architecture/` | architect | propose via review; do not silently diverge |
| `packages/shared/` | architect (types) | both import; PRs that change enums need architect/product if behavior changes |
| `prisma/schema.prisma` | architect lock / backend migrations | frontend never writes SQL here |
| `prisma/migrations/` | backend | |
| `prisma/seed.ts` | backend (must match [seed.md](./seed.md)) | |
| `apps/web/app/api/` | backend | frontend only calls; do not add routes here |
| `apps/web/src/server/` | backend | |
| `apps/web/app/(loja)/` | frontend | |
| `apps/web/app/(saas)/` | frontend | **no billing/Account links** |
| `apps/web/app/(conta)/` | frontend | **no pedidos/estoque/tema** |
| `apps/web/src/ui/` | frontend | theme CSS variable application |
| `apps/web/app/globals.css` | frontend + design | map `docs/design/tokens.css` |

## Do not conflict

- **Stock qty** — only `inventory_balances` + `inventory_movements`. Store UI reads `GET /api/loja/catalogo` (projection). Never a `store_stock` table or client-side ledger.
- **Prices** — server picks `preco_varejo` / `preco_atacado` from the customer document type. Lines freeze `unit_price_centavos`. Client may display; client must not submit a trusted unit price.
- **Roles** — session + membership. Client must not send `saas_role`.
- **Theme** — one `themes` row per tenant. Store and SaaS GET the same tokens. Account does not.
- **Entitlement** — Account writes `tenants.subscription_status`. SaaS/Store only read it via middleware.

If a screen needs data that is not in [api.md](./api.md), add the endpoint in architecture first — do not grow an ad-hoc BFF in a Server Component.
