# Stack

Locked for the MVP. Change only if the architect reviews tenancy, identity, or deploy.

## Choice

**One Next.js 15 App Router app** (`apps/web`) with route groups `(loja)`, `(saas)`, and `(conta)` serving `/loja`, `/saas`, and `/conta`. npm workspaces add `packages/shared` for enums and DTO types that both sides import.

A single app is the boring path a small team can demo today: one `npm install`, one Prisma schema, one SQLite file, one seed, one `npm run dev` on port 3000. The three chromes stay separate because each route group has its own layout and **must not** import another surface’s nav. Store and SaaS read the same tenant theme pipeline; Account uses product chrome (`data-theme="product"`). A three-app monorepo would triple cookie, env, and build wiring without buying isolation we do not need — tenant isolation is a query rule, not a process boundary.

SQLite via Prisma is enough for local MVP. The schema is Postgres-shaped (no SQLite-only types). `docker-compose.yml` is optional later; it is not required to run the demo.

## Runtime

| Piece | Choice |
|---|---|
| Language | TypeScript, strict |
| UI + BFF | Next.js 15 (App Router, React 19) |
| API | Route handlers under `apps/web/app/api/` |
| Shared contract | `packages/shared` + `docs/architecture/openapi.yaml` |
| DB | SQLite file `prisma/dev.db` (Prisma) |
| Auth | HttpOnly session cookies, **one cookie per surface** |
| Validation | Zod on the server; shared unions in `@saas-frota/shared` |
| Locale | `pt-BR` (`<html lang="pt-BR">`) |
| Theme | CSS variables from tenant row (Store/SaaS) or product tokens (Account) — names in `docs/design/tokens.md` |
| Package manager | npm workspaces |

Do **not** add Stripe, Meta Cloud API, or a required SMTP provider. Outbox adapters are stubs (see [ports.md](./ports.md)).

## Folder map

```
saas_frota/
  docs/product/            # product agent
  docs/design/             # design agent
  docs/architecture/       # this contract
  packages/shared/         # enums, error codes, DTOs (no Prisma, no React)
  prisma/                  # schema + migrations + seed
  apps/web/
    app/
      (loja)/loja/         # Store UI
      (saas)/saas/         # SaaS UI — no /conta links
      (conta)/conta/       # Account UI — no ops links
      api/loja|saas|conta  # HTTP, grouped by surface
    src/server/            # domain ports, authz, db
    src/ui/                # shared presentational hooks (theme apply)
```

See [ownership.md](./ownership.md) before editing.

## How to run (local)

```bash
cd /Users/moshe/Projects/saas_frota
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

- Store: http://localhost:3000/loja
- SaaS: http://localhost:3000/saas
- Account: http://localhost:3000/conta

Default tenant slug is `demo` (`NEXT_PUBLIC_DEFAULT_TENANT_SLUG`). Seed users: [seed.md](./seed.md).

### Scripts (repo root)

| Script | Action |
|---|---|
| `npm run dev` | Next.js on :3000 (all three surfaces) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Insert tenant `demo` |
| `npm run db:reset` | Wipe SQLite, migrate, seed |

### Environment

Copy `.env.example`. No production secrets belong in git.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `SESSION_SECRET` | HMAC for session cookies (dev placeholder only) |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | `demo` |
| `CNPJ_REGISTRY_ENABLED` | `false` = port degrades (checksum still runs) |

## Auth cookies

Three cookies so `dono` can hold SaaS and Account sessions at once:

| Cookie | Surface | Login path |
|---|---|---|
| `sf_sessao_loja` | Store | `POST /api/loja/login` |
| `sf_sessao_saas` | SaaS | `POST /api/saas/login` |
| `sf_sessao_conta` | Account | `POST /api/conta/login` |

`HttpOnly`, `SameSite=Lax`, `Path=/`. Session payload always includes `tenantId`. APIs ignore client-supplied role, price, and stock.

## Tenant resolution (local MVP)

No subdomain wizard. Public Store reads `tenant` query **or** `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`. Authenticated APIs take `tenantId` from the session only — never from a client body field the caller can spoof onto another tenant.

## What this stack is not

- Not three deployables.
- Not a second stock database for the store.
- Not a billing provider. `subscription_status` is a column the Account surface writes.
