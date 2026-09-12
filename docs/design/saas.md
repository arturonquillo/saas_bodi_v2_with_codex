# SaaS UX

Operator workspace. Conceptual base `/saas`. Tenant theme, **compact** density. **Zero billing / Account links.**

Visual chrome (Desk): [`saas-desk.md`](./saas-desk.md). This file owns flows and permissions. If a layout note here disagrees with Desk, **Desk wins**.

## Users and jobs

| Role | Job in the shell |
|---|---|
| Supervisor | Oversight, all legal transitions, visível na loja, tema, CPF/CNPJ + canais, chat de estoque, outbox |
| Vendedor | Create orders, confirm/cancel before warehouse dispatch, pipeline, outbox |
| Estoquista | Fila confirmado → separando → despachado; quantities + movements; optional ajuste |
| Entregador | Fila despachado → entregue |

UI hides illegal actions. API is the authority.

## Flow

### Entry

`/saas/entrar` → role home:

| Role | Home |
|---|---|
| Supervisor, vendedor | Pedidos |
| Estoquista | Fila do depósito |
| Entregador | Entregas |

Denied Account users (e.g. `supervisora@demo.local` on `/conta`) never see a Conta item here.

### Pedido — status is the hero (information, not a slab)

1. Open detail. Desk form: breadcrumb `Pedidos / {id}`, title = id (18–20px) + **status as a small tag**, optional compact 5-step trail (`novo → confirmado → separando → despachado → entregue`). `cancelado` = danger banner, trail marked interrupted. **Not** a giant status hero slab.
2. Button row under the title: **only legal transitions** for this role × status. Primary = forward. Danger outline = cancel when allowed.
3. On success: hero updates; history appends; **notify line** appears in an `aria-live` region:
   - `ambos`: “Cliente avisado no WhatsApp e por e-mail.”
   - `whatsapp`: “Cliente avisado no WhatsApp.”
   - `email`: “Cliente avisado por e-mail.”
   Seller is also notified; secondary sentence: “Vendedor avisado no mesmo canal.”
4. Outbox stub still uses this copy — it reflects configured channels, not a live Meta tick.

### Create order (supervisor, vendedor)

`/saas/pedidos/novo`: pick existing customer (search by masked document / name). Add SKU lines with qty. Unit price from **customer document type** (CPF varejo / CNPJ atacado), shown read-only. MOQ enforced for CNPJ. Submit → `novo`. No payment fields.

### Stock

List: sku, nome, em estoque (on_hand), reservado, disponível, and — **supervisor only** — **Visível na loja** toggle in this table (not in Configuração).

SKU detail: the three quantities, movements, supervisor toggle, supervisor/estoquista **Ajustar quantidade** (delta + motivo obrigatório). Vendedor: read-only, no toggle, no ajuste.

### Chat de estoque (supervisor)

One thread. Never silent overwrite.

1. Upload CSV/XLSX (and optional short instruction).
2. System message: parsing… then a **preview card** (not applied): rows create / update / erro.
3. Preview card actions: **Confirmar aplicação** (button) and **Descartar**. Closing or leaving without confirm writes nothing.
4. Confirm is **not** inferred from chat text (“ok”, “aplica”). Only the button.
5. Result message: applied count, skipped errors. Invalid rows listed; valid rows committed.

### Tema (supervisor)

Fields: marca, primary, accent, background, logo. Live **preview pane** only (see `tokens.md`). Salvar / Cancelar. Contrast gate. Account chrome must not change.

### Configuração (supervisor)

Only: `aceita_cpf`, `aceita_cnpj` (at least one remains on — disable the last remaining true), `canais_aviso` (`email` | `whatsapp` | `ambos`), and **Vendedor padrão da loja** (seed `vendedor@demo.local`; single select of sellers if the API exposes it, otherwise read-only label). No visível_loja, no tema, no billing.

### Outbox

Table: date, channel, recipients (masked tax IDs if present), template key, pedido id, `pendente` | `enviado` | `falha`. Supervisor: all. Vendedor: readable (tenant notices). No “reenviar” provider action in MVP.

### Entitlement not `ativa`

Persistent top banner on every SaaS screen. All write controls disabled (transitions, create, toggle, adjust, theme save, config save, chat confirm). Reads stay. **No** “regularizar na Conta” link.

## Layout (desktop / mobile)

### Shell

- **Desktop:** 16rem dark zinc sidebar (`#09090b`) + canvas `#0c0c0e` + zinc list/form cards. Marca at sidebar top. Grouped Operação / Casa. Sticky inset header with breadcrumb + Sair. Avatar in sidebar footer. **No** Account / billing.
- **Mobile:** same header + hamburger drawer. Warehouse and courier also get a sticky **bottom bar** (ghost inactive). They are **mobile-first**: no dense tables as the only view.

### Pedidos list

Supervisor / vendedor: KPI row (loaded counts) + table — id, customer (masked doc), status, total, updated. Filters by status.

Estoquista: **cards** (especially &lt;768px). Title = pedido id + customer first name. Status badge. Primary action on card when legal (Separar / Despachar). Hit 52px full width.

Entregador: same card pattern. Primary **Marcar entregue** only on `despachado`. `entregue` cards are read-only history.

### Pedido detail

```
[ Pedidos / {id} ]
[ {id} + small status tag ]
[ Compact trail ]
[ Legal actions — 52px full width on warehouse/courier mobile ]
[ Aviso: Cliente avisado no WhatsApp… ]  ← after change
[ Itens — Desk table ]
[ Cliente masked ]
[ Histórico ]
```

Do not show illegal buttons greyed “sem permissão” — omit them. Do not use a large status slab.

### Estoque

Desktop table. Mobile stacked rows with the three qty figures stacked and labeled (never three unlabeled numbers). Supervisor visibility = switch with accessible name “Visível na loja, SKU X”.

### Chat

Message column + drop zone. Preview = wide table card inside the thread. Confirm button visually distinct (primary), not a send-icon on the composer.

### Warehouse / courier a11y

- Primary actions ≥ 48×52px, 12px gap between stacked buttons.
- Status change confirms with a second tap only if the action consumes stock (`despachado`): dialog “Isso baixa o estoque. Confirmar despacho?”
- Other forwards (separar, entregue) are single tap + undo is **not** offered (status machine has no undo).

## States

| State | Behavior |
|---|---|
| Empty pedidos / fila | Role-specific empty (see copy). |
| Loading | Table/card skeletons. |
| Error | Tentar de novo. |
| Forbidden screen | Redirect to role home; no billing upsell. |
| Illegal transition (race) | Toast + refresh; no invented retry that re-posts blindly. |
| Entitlement | Banner + disabled writes. |
| Parse-error (chat) | Preview shows row errors; Confirm applies only valid rows — label says so. Empty/unreadable file: no preview, error in thread. |
| Discard preview | Thread notes “Nada foi aplicado.” |
| Theme contrast fail | Inline, save disabled. |
| Config last document flag | Cannot turn off the last of CPF/CNPJ. |
| Masked CPF/CNPJ | Lists, detail, outbox recipients. |

## Tokens used

`[data-theme="tenant"]` + `[data-density="compact"]`. Color mode Claro / Escuro / Automático (default Claro). Warehouse/courier on small viewports: 16px body, large hits. Tenant pine/terracotta seed tints **buttons, links, and KPI numbers** — not the sidebar or canvas. System studio hexes in [`saas-desk.md`](./saas-desk.md). Inter only.

## Copy (pt-BR)

See `copy-pt-BR.md`. Status labels and “Cliente avisado no WhatsApp” are mandatory.

## Handoff to frontend

- **Do not** put Assinatura, Plano, or Conta in nav or user menu.
- **Do not** show illegal transitions.
- **Do not** apply inventory from chat text; confirm is a button on the preview card.
- **Do not** bury `visivel_loja` in Configuração.
- **Do not** invent a second store-qty column.
- **Do not** add courier assignment, maps, or warehouse pick-path.
- After status change, always show the notify sentence matching `canais_aviso`.
- Entitlement banner has no Account hyperlink.
- Seed role chip labels: Supervisora / Supervisor, Vendedor, Estoquista, Entregador.
