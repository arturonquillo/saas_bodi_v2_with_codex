# Threats

MVP threat notes. Blockers if a PR ships the failure mode.

## Tenant isolation / IDOR

**Risk:** Authenticated user on tenant A reads B’s orders, SKUs, outbox, or import preview.

**Rule:** Every query includes `tenant_id = session.tenantId`. Foreign ids that fail the scope check return **404** `nao_encontrado`, not 403 with a useful distinction. Do not accept `tenant_id` from the JSON body on authenticated routes.

**Tests:** seed a second tenant in backend tests (not required in demo seed); prove 404.

## Client-trusted role, price, stock

**Risk:** Body includes `saas_role`, `unit_price_centavos`, `available`, or `on_hand` and the server persists it.

**Rule:** Role comes from `memberships`. Price list from `customer_profiles.document_type` (guest = varejo). Qty from `inventory_balances`. Strip unknown/trusted fields in Zod.

## Entitlement bypass

**Risk:** Store checkout or SaaS transition succeeds while `inadimplente` / `cancelada`.

**Rule:** `requireEntitlementAtiva()` on those writes. UI banner is not sufficient. Account owner can still change the flag.

## Tax ID leakage (LGPD)

**Risk:** Full CPF/CNPJ in logs, URLs, outbox payload, HTML page source, or error messages.

**Rule:** Persist digits; expose `document_last4` + mask (`***.***.***-00` / `**.***.***/****-00`). URLs use opaque `user_id` / `order_id`, never the document. Structured logs: `document_last4` only. Import files are tenant-scoped and not served publicly.

## File upload

**Risk:** XLSX with macros, path traversal, unbounded size, apply without confirm.

**Rule:** MIME allow-list CSV/XLSX; 2 MB cap; store under tenant id; parse to rows only; **never execute**. Apply only via confirm endpoint. Preview id is tenant-scoped (IDOR).

## CNPJ lookup abuse

**Risk:** Open proxy to BrasilAPI; scraping.

**Rule:** Rate limit per IP. Enable live registry only with `CNPJ_REGISTRY_ENABLED`. Time out. Degrade path is intentional — do not retry-storm.

## Session / CSRF

**Risk:** Cookie reused across surfaces; CSRF on state-changing POST.

**Rule:** Cookie name is surface-specific; handler checks `session.surface`. SameSite=Lax. Same-origin Next app; reject cross-site POSTs (Origin check on mutations). No session token in query strings.

## Billing chrome leak

**Risk:** SaaS nav or API teaches workers how to change `subscription_status`.

**Rule:** No `/conta` links in SaaS layout. Only `/api/conta/assinatura` writes the flag, and only with Account cookie + `account_owner`.

## Notification stub confused with production send

**Risk:** Someone “finishes” WhatsApp by posting to Meta without a product decision.

**Rule:** `StubOutboxTransport` is the MVP adapter. Real providers need a product + architect change. Outbox rows are the acceptance proof.

## Performance (not security, but contract)

Catalog: single join, paginate if &gt;100 SKUs. Orders/stock lists: use `(tenant_id, status)` indexes. No N+1 on lines — `include` in one query.

## Residual risks (accepted for MVP)

- SQLite file on disk is not encrypted at rest; local demo only.
- `SESSION_SECRET` in `.env` is a placeholder; rotate before any shared host.
- WhatsApp numbers stored in plaintext (PII); encrypt-at-rest is a later hardening.
- No second-tenant in the demo seed — isolation tests are backend’s job.
- Single Next process means a bug in one route handler shares memory with others; mitigate with tenant checks, not process isolation.
