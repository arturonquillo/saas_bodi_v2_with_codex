# Overview UX

IA and chrome for the MVP only. Product source: `docs/product/spec.md`, `docs/product/mvp.md`. Do not add surfaces, nav items, or modules that are not listed here.

Copy is **pt-BR**. Theme tokens apply to Store and SaaS. Account uses product chrome.

## Surfaces and chrome

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    Loja      │   │     SaaS     │   │    Conta     │
│  /loja       │   │    /saas     │   │    /conta    │
│  cliente     │   │  operadores  │   │ account_owner│
│  tenant theme│   │ tenant theme │   │ product theme│
│  cadastro →  │   │  zero billing│   │  zero ops    │
│  pedido      │   │  links       │   │  nav         │
└──────────────┘   └──────────────┘   └──────────────┘
        │                  │                  │
        └──────── tenant data ────────────────┘
```

Three shells. Shared tenant data. **No shared nav.** A person who is both `account_owner` and supervisor (seed `dono`) uses two URLs and two chromes — never a combined app bar.

| Rule | Store | SaaS | Account |
|---|---|---|---|
| Theme | Tenant tokens | Tenant tokens, denser | Product tokens only |
| Audience | End customer | One SaaS role | `account_owner` only |
| Billing links | None | **None** | The whole surface |
| Pedidos / estoque / tema | Customer's own orders | Role-filtered | **None** |
| Guest | Catalog + login/register | No | No |

## Information architecture

### Store (`/loja`)

| Screen | Route (conceptual) | Who |
|---|---|---|
| Catálogo | `/loja` | Guest + customer |
| Produto | `/loja/produto/:sku` | Guest + customer |
| Carrinho | `/loja/carrinho` | Guest + customer (checkout gated) |
| Entrar | `/loja/entrar` | Guest |
| Cadastro | `/loja/cadastro` | Guest |
| Meus pedidos | `/loja/pedidos` | Customer |
| Pedido | `/loja/pedidos/:id` | Owner customer |

No guest checkout. No payments. No shipping calculator. No account-billing link.

### SaaS (`/saas`)

| Screen | Route (conceptual) | Roles |
|---|---|---|
| Entrar | `/saas/entrar` | All workers |
| Pedidos / filas | `/saas/pedidos` | All (list filtered by role) |
| Novo pedido | `/saas/pedidos/novo` | Supervisor, vendedor |
| Pedido | `/saas/pedidos/:id` | All who can see that order |
| Estoque | `/saas/estoque` | Supervisor, vendedor (read), estoquista |
| SKU | `/saas/estoque/:sku` | Same; writes per role |
| Chat de estoque | `/saas/chat-estoque` | Supervisor |
| Tema | `/saas/tema` | Supervisor |
| Configuração | `/saas/configuracao` | Supervisor |
| Avisos (outbox) | `/saas/avisos` | Supervisor, vendedor |

Warehouse and courier do **not** get extra modules. Their “fila” is the pedidos list with a role title and status filter locked.

### Account (`/conta`)

| Screen | Route (conceptual) | Who |
|---|---|---|
| Entrar | `/conta/entrar` | `account_owner` |
| Assinatura | `/conta` | `account_owner` |

One working screen after login. No pedidos, estoque, tema, pessoas, or Store preview.

## Navigation per role

Hide what the API already denies. Do not show a disabled “Tema” to a seller.

### Store customer (and guest)

| Item | Guest | Logged-in |
|---|---|---|
| Catálogo (logo / marca) | yes | yes |
| Carrinho | yes | yes |
| Entrar / Cadastrar | yes | no |
| Meus pedidos | no | yes |
| Sair | no | yes |

Header right: cart count + auth. No SaaS, no Conta.

### Supervisor

`Pedidos` · `Estoque` · `Chat de estoque` · `Tema` · `Configuração` · `Avisos` · Sair

Estoque is where `visivel_loja` lives (column + SKU detail). **Not** inside Configuração.

### Vendedor

`Pedidos` · `Estoque` · `Avisos` · Sair

Estoque is read-only (on-hand, reserved, available, movements). No visibilidade toggle, no ajuste, no chat, no tema, no config.

### Estoquista

`Fila do depósito` · `Estoque` · Sair

Fila = pedidos in `confirmado` | `separando` | `despachado`. Estoque allows quantidade + motivo. No avisos, tema, chat, config.

### Entregador

`Entregas` · Sair

Entregas = pedidos in `despachado` | `entregue`. No estoque.

### Account owner

`Assinatura` · Sair

If the same user also has a SaaS role, **do not** deep-link “ir para o SaaS” or “ir para a loja” in MVP. They know the other URL. Split chrome stays split.

## Chrome rules

Look and shell geometry: SaaS Desk [`saas-desk.md`](./saas-desk.md); Store + Account chrome [`visual.md`](./visual.md) (Woo Storefront / product navy).

1. **SaaS never links to `/conta`, planos, fatura, or assinatura.** Entitlement problems use a read-only banner (copy in `copy-pt-BR.md`), not a billing CTA.
2. **Account never links to pedidos, estoque, tema, or loja.**
3. **Store never links to SaaS or Account.** Store footer is shop-only (Catálogo / Carrinho / Entrar).
4. Store header is Woo (white): logo/`marca` left, Catálogo, Carrinho + count, auth. SaaS `marca` lives at the **top of the light sidebar**, not on a painted primary header. Account header is the product wordmark `saas_frota` + “Conta”.
5. Role chip + **Sair are pinned at the bottom of the SaaS sidebar** (`Supervisora`, `Vendedor`, …) so the demo can prove the shell. Not a role switcher. Not in the desktop top bar.
6. Entitlement `inadimplente` / `cancelada`: persist a top banner on every SaaS screen; disable write controls. Store: browse ok; checkout replaced by the reason.
7. Default language pt-BR. Do not ship an i18n toggle.
8. CPF/CNPJ: mask in every list and detail (`***.***.***-00`, `**.***.***/****-00`). Full digits only inside the active input while typing.
9. Pedido is a **solicitação**. Never show “pagar”, “PIX”, or “checkout pago”.
10. Tenant primary colors **actions, links, and the active sidebar accent only**. Do not fill the SaaS sidebar or the shop page with `--color-primary` or `--color-background`.

## Shared patterns

### Status

Order status is the hero on every pedido detail (Store and SaaS). Use the same labels and colors:

| Status | Tone |
|---|---|
| `novo` | Neutral / primary outline |
| `confirmado` | Primary filled |
| `separando` | Warning |
| `despachado` | Accent |
| `entregue` | Success |
| `cancelado` | Danger |

After a legal transition, show the notify line immediately: e.g. “Cliente avisado no WhatsApp e por e-mail.” Channels follow tenant `canais_aviso`. Outbox is a stub — the UI still tells the truth about the **intended** channel.

### Wholesale vs retail

Price list is never implied. Guest and CPF: chip **Varejo**. CNPJ: chip **Atacado** + **Qtd. mín. N un** next to the price. Pack/MOQ is visible on catalog card, PDP, cart line, and SaaS create-order line.

### Stock honesty

Store shows only `visivel_loja` SKUs. Quantity = `max(0, on_hand - reserved)`. Zero available → “Sem estoque”, no add. SaaS shows three numbers: **Em estoque**, **Reservado**, **Disponível**. Do not display a fourth “estoque da loja” column.

### Documents

One field pattern. Tenant `aceita_cpf` / `aceita_cnpj` decides the switch. Both true → segmented **CPF | CNPJ**. One true → that document only, no empty tab. CNPJ lookup fills razão social; fields stay editable. Registry down → warning + proceed (`cnpj_registro_pendente`).

### Focus and hits

Visible 2px focus ring. Warehouse/courier primary actions ≥ 48×52px, full width on small viewports. Form fields labeled (not placeholder-only).

## Accessibility baseline

- Contrast ≥ 4.5:1 for body and status text (see `tokens.md` save gate).
- Status is text + color, never color alone.
- Keyboard: tab order header → main → actions. Dialogs trap focus and return it.
- `aria-live="polite"` on notify-after-status and chat apply result.
- Tax IDs: `autocomplete` on, but rendered masked after blur/save.
- Do not log or print full CPF/CNPJ in DOM comments, `title`, or `data-*`.

## Tokens

See [`tokens.md`](./tokens.md). Visual language: [`visual.md`](./visual.md) — SaaS is shadcn/studio admin (dark zinc, grouped sidebar); Store is Woo Storefront (white shop, dark footer); Account is product navy. Seed **Norte Atacado** (`#0F4F3E` / `#C2410C` / `#F6EFE3`) tints actions, prices, and KPI numbers, not the sidebar. Account (`#1E3A5F` / `#F4F6F8`) stays a different product.

## Handoff to frontend

- Implement only the screens in the tables above.
- Role nav is a hide/show map, not a permission client.
- Illegal transitions: omit the button. Do not show and 403.
- Do not add dashboards, people admin, payments, or “ir para a conta”.
- Copy: [`copy-pt-BR.md`](./copy-pt-BR.md). States: [`states.md`](./states.md). SaaS look: [`saas-desk.md`](./saas-desk.md). Store/Account look: [`visual.md`](./visual.md).
