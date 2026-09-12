# saas_frota

Multi-tenant wholesale/retail SaaS: **Store** (`/loja`), **SaaS** (`/saas`), **Account** (`/conta`).

Product: `docs/product/spec.md`. Architecture: `docs/architecture/`. Design: `docs/design/`.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- Loja: http://localhost:3000/loja
- SaaS: http://localhost:3000/saas
- Conta: http://localhost:3000/conta

SQLite file: `prisma/dev.db`. No Docker required.

## Seed (`demo`)

Password for every user: `Demo@1234`

| Email | Surface |
|---|---|
| `dono@demo.local` | Account owner + supervisor (two chromes) |
| `supervisora@demo.local` | SaaS supervisor only |
| `vendedor@demo.local` | Seller (default Store assignee) |
| `estoque@demo.local` | Warehouse |
| `entregador@demo.local` | Courier |
| `cliente.cpf@demo.local` | Store, varejo |
| `cliente.cnpj@demo.local` | Store, atacado |

Full contract: `docs/architecture/seed.md`.

## Stack

One Next.js 15 app, Prisma + SQLite, shared types in `packages/shared`. See `docs/architecture/stack.md`.

## Ownership

Do not put billing links in SaaS nav. Do not add a second stock table. Folder owners: `docs/architecture/ownership.md`.
