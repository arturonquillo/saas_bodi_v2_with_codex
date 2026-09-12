# Store UX

Customer store. Conceptual base `/loja`. Tenant theme. pt-BR.

Visual chrome: [`visual.md`](./visual.md) (WooCommerce Storefront). **Kit:** [`shadcn.md`](./shadcn.md) — compose every screen from the named shadcn primitives. Do not invent `.sf-*` controls.

## Users and jobs

| User | Job |
|---|---|
| Guest | Browse varejo prices and honest stock; register or login |
| Cliente CPF | Buy varejo; place a request; track own orders |
| Cliente CNPJ | Buy atacado with MOQ; same path |
| Any customer when entitlement ≠ `ativa` | Browse; understand why checkout is blocked |

No guest checkout. Pedido is an unpaid request.

## Flow

### Entry

Guest lands on **Catálogo**. Header: wordmark/`marca`, cart, Entrar, Cadastrar. Theme from tenant tokens (seed: Norte Atacado cream/pine/terracotta) — tokens tint **prices, buttons, and the optional 36px utility bar**, not the white shop page.

### Happy path — register → order → track

1. Guest sees only `visivel_loja` SKUs. Price = **Varejo**. Available qty shown. Hidden SKU absent. Visible + 0 available = card **Sem estoque**, CTA disabled.
2. PDP: name, channel price, available, MOQ if atacado session, add-to-cart (qty stepper).
3. Cart: lines, channel chip, per-line MOQ check, primary **Finalizar pedido** if logged in and `ativa`.
4. Guest on cart: primary becomes **Entrar para pedir**. Secondary **Cadastrar**. No order submit.
5. Cadastro: document switch from tenant flags → checksum → CNPJ registry fill → criar conta → return to cart or catálogo.
6. Login: same document field + password. CPF session keeps varejo; CNPJ switches catalog/cart to atacado + MOQ.
7. Submit order (server prices, not client): lines snapshot name, qty, unit price. Status `novo`. Redirect to pedido detail.
8. Meus pedidos: own orders only. Detail: **status as a small `Badge`** + optional trail + history. Customer cannot change status.

### CNPJ lookup

On valid checksum blur/submit of CNPJ: show loading “Consultando CNPJ…”. Success: fill razão social (editable). Failure/timeout: **registry-down** `Alert`; user may continue; persist `cnpj_registro_pendente`. Invalid checksum: block, no lookup.

### Entitlement

Browse always. On cart, if `inadimplente` or `cancelada`, replace submit with the explicit reason `Alert`. Do not send the create call from the UI; API also rejects.

## Layout (desktop / mobile)

Woo shop. Page is **white**. Align with [`visual.md`](./visual.md). Kit nesting: [`shadcn.md`](./shadcn.md) Store routes.

### Catálogo `/loja`

- **Desktop:** header + toolbar `shop_showing` + grid **4** `Card`s. Card: 1:1 photo tile, name (16/600), channel price (`text-primary` tabular), `Badge` Varejo/Atacado, available or Sem estoque, optional MOQ text, `Button variant="outline"` **Adicionar**.
- **Tablet:** 3 columns. **Mobile:** **2** columns (not 1), 16px page padding, add `h-10` / `h-11`.

Guest/CPF: `R$ 12,00` + Varejo `Badge`. CNPJ: atacado price + Atacado `Badge` + `Qtd. mín. N un`.

### PDP `/loja/produto/[id]`

Desktop Woo split: media **~48%** left, summary right. `Breadcrumb` Início / Catálogo / Nome. Title Inter 24–28/600, price 24 tabular primary + channel `Badge`, qty stepper 44×44, `Button default h-11` Adicionar. Mobile: stack media then summary. No image gallery (out of MVP). If SKU not `visivel_loja` or unknown: not-found `Alert`.

### Carrinho `/loja/carrinho`

`Table` on desktop, stacked lines on mobile. Each line: 48px tile, name, unit price + channel `Badge`, stepper, subtotal, remove `Button ghost`. Footer: total + primary (`h-11`). Sticky footer on mobile. Empty: see States.

### Cadastro / Entrar `/loja/cadastro` · `/loja/entrar`

Centered `Card` max 420px. Kicker `auth_kicker_store`. Title `auth_my_account` / Entrar / Cadastrar. One document `Input h-11`. `RadioGroup` **CPF | CNPJ** only if both flags. Password + submit `Button default h-11 w-full`. Cadastro CNPJ: razão social (filled, editable). No social login. No Fraunces wordmark.

### Meus pedidos `/loja/pedidos` · `/loja/pedidos/[id]`

List: `Table` or 1px rows — number (600), date muted, status `Badge`, total tabular. Detail: `Breadcrumb` Início / Meus pedidos / {id}. Status as a **small `Badge`** (comfortable density, same language as SaaS form — not a giant slab). Optional trail + history. Customer document **masked**. Notify channels are not actionable here.

## Components

### shadcn inventory (mandatory)

| Component | Screen / region | Notes |
|---|---|---|
| `Button` `ghost` | Header nav, Entrar, Sair, Carrinho, line remove | Current nav = underline primary |
| `Button` `default` `sm` | Header Cadastrar | |
| `Button` `outline` | Product card Adicionar | `border-primary text-primary`, same on every card |
| `Button` `default` `h-11` | PDP add, Finalizar / Entrar para pedir, auth submit | |
| `Button` `link` | Footer links, Ver catálogo, auth switch | |
| `Badge` | Cart count, Varejo/Atacado, order status | Tones in `shadcn.md` |
| `Card` | Product tile, auth, optional empty art | `rounded-lg`, not `rounded-xl` default |
| `Table` | Cart desktop, meus pedidos list, pedido lines | |
| `Breadcrumb` | PDP, pedido detail | |
| `Field` + `Input` | Auth, qty (with icon `Button`s) | Store fields `h-11` |
| `RadioGroup` | CPF \| CNPJ | Only if both flags |
| `Alert` | Entitlement, registry-down, guest hint, price-changed, errors, cancelado | No `/conta` href |
| `Skeleton` | Catalog (1:1 media), PDP, lists | Header stays |
| `Separator` | Footer column rhythm | |

**Do not use** on Store: `Sidebar`, `Sheet`, `NavigationMenu`, `Tabs`, `DropdownMenu`, `Avatar`, `Dialog`.

### Composition

Header is Tailwind sticky + `Button`s — not `NavigationMenu`. Product `Card`: media flush (`gap-0 py-0`) → `CardContent` title / price / `Badge` / `Button`. Cart page, not a cart `Sheet`. Photo tile and qty stepper are Tailwind recipes in `shadcn.md`, not new primitives.

## States

| State | Where | Behavior |
|---|---|---|
| Empty catalog | Catálogo | “Nenhum produto visível na loja.” No fake SKUs. |
| Empty cart | Carrinho | “Seu carrinho está vazio.” Link to catálogo. |
| Empty orders | Meus pedidos | “Você ainda não fez pedidos.” |
| Loading | All | `Skeleton` cards/rows; keep header. |
| Error (load) | All | `Alert` “Não foi possível carregar.” **Tentar de novo**. |
| Not found SKU | PDP | “Produto indisponível.” Back to catálogo. |
| Sem estoque / indisponível | Card, PDP, cart | Label **Sem estoque**. Cannot add. If qty in cart becomes 0 available before submit: line error, block submit. |
| MOQ | PDP, cart, submit | “Quantidade mínima no atacado: N.” Stepper min = MOQ for CNPJ. Submit blocked under MOQ. |
| Guest checkout | Cart | No submit. **Entrar para pedir**. |
| Entitlement-blocked | Cart | `Alert` with `inadimplente` or `cancelada` reason. Browse remains. |
| Invalid checksum | Cadastro | `FieldError` on document field. |
| Registry-down | Cadastro CNPJ | Warning `Alert`; allow submit after checksum. |
| Registry filled | Cadastro CNPJ | Razão social editable; helper “Confira os dados da empresa.” |
| Auth required | Meus pedidos | Redirect to entrar with return URL. |
| Forbidden / other customer | Pedido | Same empty/not-found as unknown id (no leak). |
| Masked tax ID | Header session, pedido | `***.***.***-00` / `**.***.***/****-00`. Never full in page. |
| Parse N/A | Store | No file ingest on this surface. |

Full patterns: [`states.md`](./states.md). Copy: [`copy-pt-BR.md`](./copy-pt-BR.md).

## Tokens used

`[data-theme="tenant"]` + `[data-density="comfortable"]`. Map onto shadcn per [`shadcn.md`](./shadcn.md) / [`tokens.md`](./tokens.md): `--background` = **white**; `--primary` = tenant pine (prices + buttons); `--ring` = tenant accent. `--color-background` cream = **utility bar only**. Accent `Badge` for **Atacado** via `--brand-accent`, not shadcn `--accent`.

## Copy (pt-BR)

Key strings live in `copy-pt-BR.md` (store section). On-screen channel words: **Varejo**, **Atacado**, **Sem estoque**, **Entrar para pedir**, **Finalizar pedido**, **Meus pedidos**.

## Handoff to frontend

### Must implement

- Woo chrome in `visual.md` with primitives in `shadcn.md`.
- Honest stock projection only. Square photo tiles (no upload).
- Legal checkout rules: no guest submit; entitlement `Alert` names **which** status blocked the order.

### Must not improvise

- Do not show hidden SKUs or a second stock number.
- Do not trust client unit price or available qty on submit.
- Do not add guest checkout, payment, or shipping fields.
- Do not render full CPF/CNPJ in lists, titles, or `view-source` happy path.
- Tenant with only CPF: no CNPJ segment (and reverse).
- Cart entitlement banner must state **which** status blocked the order (`inadimplente` vs `cancelada`).
- After login, re-price the cart from the server list (varejo ↔ atacado); show a notice if totals changed.
- Do not use `Sheet` for cart, `Sidebar` on Store, or a 1-column mobile catalog.
- Do not invent `.sf-*` product-card / header primitives.
- No Store→SaaS or Account links.

### Existing components to reuse

`button`, `badge`, `card`, `table`, `breadcrumb`, `field`, `input`, `radio-group`, `alert`, `skeleton`, `separator`.

### Install

None.
