# States

Cross-surface empty, error, forbidden, loading, entitlement, and parse-error. Copy strings: [`copy-pt-BR.md`](./copy-pt-BR.md).

Use these patterns; do not invent extra full-page illustrations or a toast-only error language.

## Loading

- Keep the surface chrome (Store header / SaaS nav / Account product bar).
- Replace the main body with skeletons that match the layout (cards on Store catalog, rows on SaaS tables, one card on Account).
- No spinner-only blank page.
- Chat parse: a single in-thread line “Lendo o arquivo…” — not a new route.

## Empty

| Surface | Context | Title | Next step |
|---|---|---|---|
| Store | Catalog, no visible SKUs | Nenhum produto visível na loja. | None for the customer (supervisor must toggle `visivel_loja`) |
| Store | Cart | Seu carrinho está vazio. | Ver catálogo |
| Store | Meus pedidos | Você ainda não fez pedidos. | Ver catálogo |
| SaaS | Pedidos (supervisor/vendedor) | Nenhum pedido. | Novo pedido |
| SaaS | Fila depósito | Nada na fila do depósito. | None (they wait) |
| SaaS | Entregas | Nenhuma entrega. | None |
| SaaS | Estoque | Nenhum SKU. | Chat de estoque (supervisor only) |
| SaaS | Outbox | Nenhum aviso registrado. | None |
| SaaS | Chat (no file yet) | Envie um CSV ou XLSX para gerar a prévia. | Upload |
| Account | — | Do not use an empty state; plan always exists | — |

Empty is the existing title + optional one secondary link. A small CSS-only art block (gradient tile, no image files) may sit above the title per [`visual.md`](./visual.md). Do not add a marketing empty-module or raster illustrations.

## Error (recoverable)

Inline or page section, not a modal that blocks nav.

- Load fail: “Não foi possível carregar.” + **Tentar de novo**.
- Save / transition fail: keep the form; show the server reason if it is a known domain error (MOQ, estoque, entitlement, 409 transition); otherwise generic “Não foi possível concluir.”
- Network: same generic + retry.
- Do not dump stack traces.

## Forbidden

| Who | Where | UX |
|---|---|---|
| Guest | Store meus pedidos / submit | Redirect `entrar` with return |
| Customer | Someone else’s pedido | Same as unknown id: “Pedido não encontrado.” |
| Worker | Screen their role cannot open | Redirect role home; do not list the denied module |
| Worker | Illegal transition posted | 403/409 toast; detail refreshes; no stock change |
| Non-owner | `/conta` | Generic “Você não tem acesso.” — **not** “só o dono” vs “supervisora” |
| Other tenant | Any id | 403/404 identical to not found |

Never explain another tenant’s existence.

## Entitlement

Server is the gate. UI mirrors it.

### Store (`inadimplente` / `cancelada`)

- Catalog and PDP remain.
- Cart primary submit is **removed**.
- Banner in cart (and on PDP add-to-cart if you must explain a disabled finalize path — prefer cart):
  - inadimplente: “A loja não está aceitando pedidos (assinatura inadimplente).”
  - cancelada: “A loja não está aceitando pedidos (assinatura cancelada).”
- Do not say “fale com o financeiro” as a SaaS/Account link.

### SaaS (not `ativa`)

- Banner on **every** screen: “Assinatura inadimplente. Somente leitura.” or “Assinatura cancelada. Somente leitura.”
- Disable: status buttons, novo pedido, visível toggle, ajuste, tema save, config save, **Confirmar aplicação**.
- Reads: lists, detail, outbox, chat history/preview (preview without confirm is read).
- **No** link to `/conta`.

### Account

Owner can still change the flag. No read-only lock on this surface.

## Parse-error (inventory chat)

| Case | UI |
|---|---|
| Unreadable / not CSV or XLSX | Thread error: “Não foi possível ler o arquivo.” No preview table. Nothing applied. |
| Missing required headers after synonym map | Thread error listing missing canonical columns. No confirm. |
| Mixed rows | Preview table: each row `criar` / `atualizar` / `erro` + message. **Confirmar aplicação** applies **valid rows only**. Helper: “Linhas com erro serão ignoradas.” |
| All rows invalid | Preview with errors. Confirm **disabled**. |
| User closes / Descartar | “Nada foi aplicado.” Preview id discarded. |
| Apply partial success | Result: “N linhas aplicadas. M linhas ignoradas.” Error rows listed again. |

Confirm is a **button** on the preview card. Composer text never applies.

## Registry-down (Store cadastro CNPJ)

- Checksum passed, registry timeout/5xx.
- Warning (not error): “Não consultamos o CNPJ agora. Você pode continuar e completar os dados.”
- Razão social stays editable (empty or user-typed).
- Submit allowed. Badge later in SaaS customer context is out of MVP list — do not add a supervisor queue for pendentes.

## Indisponível / MOQ (Store)

- `visivel_loja` + available 0: **Sem estoque**, add disabled. Still listed.
- Not visible: not listed (not a “indisponível” state).
- CNPJ qty &lt; `qtd_min_atacado`: inline “Quantidade mínima no atacado: N.” Submit blocked.

## Masked CPF/CNPJ

- After blur/save and in every read view: CPF `***.***.***-00`, CNPJ `**.***.***/****-00` (last 2 digits visible).
- Active input: formatted digits (`000.000.000-00` / `00.000.000/0000-00`).
- No full id in `title`, `aria-label` (use “CPF do cliente” without digits), URL, or logs.
- Outbox recipients: mask if a tax id appears; email may show local-part with domain (`c***@demo.local` optional — if messy, show role label “cliente” / “vendedor” + channel).

## Theme contrast fail

Theme editor only. Save blocked: “Este fundo não tem contraste suficiente com o texto.” Preview may still live-update so the supervisor sees why.

## Focus / disabled

Disabled write controls (entitlement, sem estoque, confirm disabled) need a text reason nearby, not color alone. Focus ring stays visible on the next enabled control.
