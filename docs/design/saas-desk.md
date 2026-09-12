# SaaS Desk UX

Visual source of truth for the **operator SaaS only**. Store (Woo) and Account (navy) are out of scope.

**Kit:** [`shadcn.md`](./shadcn.md). Shell = shadcn `Sidebar` + `SidebarInset`. Lists = `Table` inside rounded zinc cards. Confirms = `AlertDialog`. Pedidos/Estoque may show **KPI cards from real loaded counts**. Do not invent a parallel `.sf-*` kit or a fake analytics dashboard.

This spec is the **Desk chrome**. Implement structure from this file and primitives from `shadcn.md`.

Product lock: [`../product/spec.md`](../product/spec.md), [`../product/mvp.md`](../product/mvp.md). Flows and permissions: [`saas.md`](./saas.md). Tokens: [`tokens.md`](./tokens.md). Copy: [`copy-pt-BR.md`](./copy-pt-BR.md). States: [`states.md`](./states.md).

No new routes. No theme-editor fields. No billing / Conta in SaaS. Do not rename status labels.

---

## 1. Context

### Users

| Role | Home after `/saas/entrar` | Job |
|---|---|---|
| Supervisor | Pedidos | Oversight, all legal transitions, visível na loja, tema, config, chat apply, outbox |
| Vendedor | Pedidos | Create / confirm / cancel before warehouse, pipeline, outbox |
| Estoquista | Fila do depósito | `confirmado` → `separando` → `despachado`; quantities; optional ajuste |
| Entregador | Entregas | `despachado` → `entregue` |

One SaaS role per user. `account_owner` is a different surface. UI hides what the API denies.

### Jobs to be done

- Scan a queue or catalog of records in under two seconds.
- Open a record, see status, press the one legal next action.
- Warehouse / courier: one-handed, large hits, no dense table as the only view.
- Supervisor: configure store visibility, theme, documents, notices; apply inventory only after an explicit button.

### Primary goal

Make every SaaS screen read as a **studio admin**: grouped nav, KPI counts from live records, tables in rounded cards. Light by default; Escuro / Automático available. Tenant brand tints **actions and KPIs**, not chrome.

### Constraints

- Screens (only): `entrar`, `pedidos`, `pedidos/novo`, `pedidos/:id`, `estoque`, `estoque/:sku`, `chat-estoque`, `tema`, `configuração`, `avisos`.
- Roles: supervisor, vendedor, estoquista, entregador.
- `[data-theme="tenant"]` + `[data-density="compact"]`. Color mode: Claro (default) / Escuro / Automático via header `DropdownMenu`. `html.dark` only while `/saas`. Warehouse / courier `<768px`: 16px body, 52px primary.
- Inter on all SaaS. **No Fraunces.** No Source Serif 4.
- Tenant `--color-primary` = buttons, links, KPI tint **only**. Mix toward white in dark for contrast.
- Sidebar is **never** filled with tenant primary or `--color-background`.
- Status words stay Novo / Confirmado / Separando / Despachado / Entregue / Cancelado.
- Entitlement banner has **no** Conta link.
- MVP transport is an outbox stub — notify copy still tells the configured channel.

---

## 2. Information hierarchy

1. **Where am I** — workspace `marca` (sidebar top) + grouped nav + inset breadcrumb.
2. **What is moving** — KPI cards from **loaded** pedido/estoque counts (Pedidos, Estoque). Clicking a Pedidos KPI filters the table. No fake % vs last week.
3. **What record / list** — page title 24px / 600 tracking-tight, left.
4. **What can I do** — primary CTA right (list) or button row under the title (form). Warehouse: 52px full-width on the card.
5. **What is the status** — small tag (not a hero slab). Optional compact 5-step trail under the title.
6. **The data** — table or form sections on `#f4f4f5` (light) / `#0c0c0e` (dark).
7. **Who I am** — Aparência + role chip + Sair in the inset header; marca initial in sidebar footer.

Secondary: `saas_sub_*` muted under the list title (orientation). History, movements, masked document.

Do not invent a dashboard route, week-over-week stats, or a second “estoque da loja” column.

---

## 3. Flow

### Entry

`/saas/entrar` → role home (table in `saas.md`). Denied Account users never see Conta here.

### Happy path (pedido)

1. List (Desk table or warehouse card) → open id.
2. Form: breadcrumb `Pedidos / {id}`, title + **small** status tag, legal button row.
3. Forward transition. Hero does **not** grow. Tag + trail update. `aria-live` notify sentences from `copy-pt-BR.md`.
4. Warehouse despacho: confirm dialog first (`confirm_dispatch`).

### Alternate paths

- Cancel when legal: danger outline + `cancel_confirm`.
- Create: `/saas/pedidos/novo` → `novo`.
- Chat: upload → preview table → **Confirmar aplicação** only.
- Entitlement not `ativa`: banner + writes disabled.

### Completion

List refreshes on return. No undo. No payment. No billing CTA.

Full interaction rules stay in [`saas.md`](./saas.md). This file owns **chrome and visual structure**.

---

## 4. Visual direction

Three approaches were considered. They are not cosmetic variants.

### A — Painted brand rail

- **Concept:** Sidebar (and often the top bar) filled with tenant `--color-primary`. Inverse labels. Cream pills for the active item. Status as a giant colored slab.
- **Strengths:** Instant “branded app”; easy demo of Norte pine.
- **Risks:** Looks like a custom theme, not an ERP. Contrast fails when tenants pick mid tones. Warehouse tabs all look like primary buttons. Store and SaaS collapse into one painted product.
- **Use:** Rejected. Product lock forbids filling the sidebar with tenant primary.

### B — Card-dashboard ops (fake metrics)

- **Concept:** Soft app, floating cards, invented week-over-week, charts, pill filters.
- **Use:** Rejected as a **home dashboard**. KPI tiles are allowed **only** as counts of loaded Pedidos/Estoque records.

### C — shadcn/studio admin / AdminCN craft (selected)

- **Concept:** Dark zinc sidebar (`#09090b`), grouped **Operação** / **Casa**, sticky inset header with breadcrumb, canvas `#0c0c0e`, rounded zinc cards (`#141416`, 12px). Tenant color only on **buttons, links, and KPI numbers**. List = title left, primary right, KPI row, filter, table in a card. Form = breadcrumb, title + small status tag, button row. Login = zinc card on dark, Inter, “Acesso da equipe”.
- **Strengths:** Matches the shadcn/studio admin language the product now uses. Survives any tenant primary. Density with craft. Store stays Woo; Account stays navy.
- **Risks:** Can look like a generic analytics admin if we invent charts or % deltas — do not.
- **Use:** **This is the SaaS visual system.**

### Concept (locked)

A dark operations studio. The memorable decision is **crafted chrome + honest counts**: zinc shell; brand is a thin accent on actions and KPIs.

### Focal point

- List: the **KPI row + table** (or warehouse card stack), not a fake chart.
- Form: the **button row** + status tag.
- Login: the **zinc card**.

### Composition

Two columns on desktop: 16rem sidebar + fluid canvas. On the canvas, a KPI strip then a rounded zinc rectangle (list wrap or form). Title and CTA sit above.

### Personality

Quiet, fast, Brazilian ops on a dark admin. Inter. No serif wordmark. No kraft. Tenant pine/terracotta seed tints **Confirmar** and KPI numbers, not the rail.

### Why this direction

The operator surface must look like a serious shadcn admin, not a leftover light desk. Shop stays white Woo; billing stays navy; SaaS is the dark studio.

---

## 5. Layout

### Desktop (≥768)

```
┌─ sidebar 240 ─────────┬──────── canvas #f3f3f3 ──────────────────┐
│  [logo 24 / marca]    │  (no desktop top bar)                    │
│  16px pad             │                                          │
│                       │     Pedidos              [ Novo pedido ] │
│  █ Pedidos            │     saas_sub_* 12 muted                  │
│    Estoque            │     [ Status ▾ ]                         │
│    …                  │  ┌─ white body 1px #e8e8e8 ────────────┐ │
│                       │  │ thead #f7f7f7  40px                 │ │
│                       │  │ tbody 40px                          │ │
│                       │  └─────────────────────────────────────┘ │
│  ─ #e8e8e8 ─          │                                          │
│  [Supervisora]        │                                          │
│  Sair                 │                                          │
└───────────────────────┴──────────────────────────────────────────┘
```

- Shell: `min-height: 100vh`; sidebar `position: sticky; top: 0; height: 100vh`.
- **No** desktop header with marca / role / Sair. Those live in the sidebar.
- Main: max-width **1120px**, padding **24px 32px** (`--space-5` / `--space-6`).
- Entitlement banner: full-bleed under the canvas top, warning tokens, no link.

### Tablet (768–1023)

Same Desk chrome. Table may horizontal-scroll. Do not switch supervisor / vendedor to warehouse cards.

### Mobile (<768)

```
┌─ top 48–52 white, 1px #e8e8e8 ─┐
│  [ Menu ]                      │
├─ drawer = same light sidebar ──┤  (when open)
│  canvas #f3f3f3                │
│  title / CTA / filters         │
│  white table or list-cards     │
├─ warehouse/courier only ───────┤
│  Fila     Estoque              │  ghost inactive; active = 3px bar or primary text
└────────────────────────────────┘
```

- Hamburger drawer = shadcn `Sidebar` offcanvas (`Sheet` built in) — **same** light sidebar language (not a dark sheet).
- Supervisor / vendedor: `Table` + horizontal scroll. Do not invent card lists for them.
- Estoquista / entregador: `Card` list + sticky bottom `Button variant="ghost"`. Inactive tabs are **ghost** — never `variant="default"` on every tab.

### Shell — sidebar (mandatory)

| Token | Value |
|---|---|
| Width | 240px |
| Background | `#ffffff` or `#fafafa` (use `#fafafa` on the rail; white is acceptable if the 1px border remains) |
| Right border | 1px `#e8e8e8` |
| Wordmark | tenant `marca` or 24px logo, Inter 16/600, `--color-text`, padding 16px |
| Nav row | 32–36px, padding 8px 12px, Inter 13/500, 16×16 SVG `currentColor` stroke 1.75 |
| Hover | `#f0f0f0` |
| Active | 3px left `--color-primary` + `color-mix(in srgb, var(--color-primary) 8%, transparent)`, weight 600 |
| Foot | pinned bottom, 1px `#e8e8e8` top, padding 16px 12px. Role = existing accent pill. Sair = ghost/text 13px muted |

Icons (inline SVG, no new npm pack): Pedidos list, Estoque grid, Chat bubble, Tema drop, Configuração sliders, Avisos bell, Fila package, Entregas truck. Text remains the nav name.

**Never:** fill sidebar with `--color-primary`. Cream pill on a green rail. Underline-only active. Role / Sair in the desktop top bar. Assinatura / Plano / Conta.

### Per-screen layouts

#### `entrar`

Centered on `#f3f3f3`, min-height 100vh. **One** white card, max 420px, padding 32px, 1px `#e8e8e8` (optional `--shadow-sm` only — no cream radial).

```
        Acesso da equipe          ← 13px muted, no uppercase tracking
        Norte Atacado             ← Inter 16–18 / 600
        Entrar                    ← Inter 20 / 600
        [ e-mail ]
        [ senha  ]
        [ Entrar ]                ← primary, full width, 36px compact
```

No pine header slab. No Fraunces. No Store “Minha conta” heading.

#### `pedidos` (supervisor / vendedor)

List view.

| Region | Spec |
|---|---|
| Title | `Pedidos` 18–20px / 600 left |
| CTA | `Novo pedido` primary, right, 28–32px height (compact). Hide if role cannot create or entitlement lock |
| Sub | `saas_sub_pedidos` 12px muted under title |
| Filter | **Under** the title row: label `Status` + select. Options: `Todos` + six status labels. Horizontal scroll OK |
| Body | Desk table. Columns: Pedido (link, 600), Cliente (name · masked doc), Status (tag), Total (tabular, right), Atualizado |

Estoquista title = `Fila do depósito`; filter locked (no select). Entregador title = `Entregas`; filter locked. Those two roles use **cards**, not this table.

#### `pedidos/novo`

Form view.

```
Pedidos / Novo pedido
Novo pedido                    [ Criar ] or submit in button row
saas_sub_novo
────────
Cliente     [ search name / masked doc ]
Itens       [ SKU ] [ qty ] [ Adicionar item ]
            table: nome, qty, unit price (read-only), Varejo|Atacado + MOQ
```

Unit price from customer document type. No payment fields.

#### `pedidos/:id`

Form view. **Status is a small tag**, not a slab.

```
Pedidos / {id}
{id}   [Status tag]             ← title 18–20 / 600 + 22–24px tag
• • • • •                       ← optional compact trail (see Components)
[ Confirmar pedido ] [ Cancelar pedido ]   ← legal only; omit illegal
[ Cliente avisado no WhatsApp… ]           ← aria-live, after success only
──────── Itens
Desk table: nome, qty, unit, chip, line total
──────── Cliente
name · masked CPF/CNPJ
──────── Histórico
1px rows: status label · date
```

`cancelado`: danger banner, trail interrupted. Warehouse / courier: button row stacks to 52px full width, 12px gap.

#### `estoque`

List view. Title `Estoque`. Sub `saas_sub_estoque`. No primary CTA (supervisor empty-state may link Chat de estoque).

Columns: SKU (link, 600), Nome, Em estoque, Reservado, Disponível (tabular). Supervisor only: **Visível na loja** switch, accessible name `Visível na loja, SKU {code}`.

Mobile supervisor / vendedor: horizontal scroll. Estoquista on `<768`: stacked labeled qty rows (never three unlabeled numbers) **or** keep the table with scroll — do not invent a Store-like card grid. Prefer stacked labeled rows for warehouse phones.

#### `estoque/:sku`

Form view.

```
Estoque / {sku}
{nome}                         [ Ajustar ] if legal
{sku code} 12 muted
──────── Quantidades
Em estoque · Reservado · Disponível (labeled; tabular)
──────── Visível na loja          ← supervisor switch only
──────── Ajustar quantidade       ← supervisor / estoquista: delta or new on_hand + Motivo
──────── Movimentações
Desk table or 1px rows
```

Vendedor: read-only. No switch, no ajuste.

#### `chat-estoque`

List-header chrome (title + sub) + white thread column.

```
Chat de estoque
saas_sub_chat
┌─ white thread ─────────────────────────┐
│ user: #f7f7f7                          │
│ system: white + 1px #e8e8e8            │
│ preview: wide Desk table               │
│          [ Confirmar aplicação ]       │
│          [ Descartar ]                 │
├─ drop zone dashed #e8e8e8, pad 32px ───┤
│ composer (does not apply stock)        │
└────────────────────────────────────────┘
```

Confirm is a **real primary button** on the preview, never a send icon.

#### `tema`

Form view. Breadcrumb optional (`Tema`). Title `Tema`. Button row: `Salvar tema` / `Cancelar`.

Two columns on desktop (≥900px): fields left (marca, primary, accent, background, logo), **framed preview** right. Preview shows representative UI: primary button, secondary, nav active bar, table snippet, status tag — not swatches only. Shell around the editor does **not** live-recolor until save. No font fields.

#### `configuração`

Form view. One white section. Stacked: `aceita_cpf`, `aceita_cnpj` (last true disabled), `canais_aviso`, `Vendedor padrão da loja`. Button row `Salvar`. No visível_loja, no tema, no billing.

#### `avisos`

List view. Title `Avisos`. Sub `saas_sub_avisos`. No CTA.

Columns: Data, Canal (`E-mail` / `WhatsApp`), Destino (masked), Modelo, Pedido (link), Status (`Pendente` / `Enviado` / `Falha`). No reenviar.

---

## 6. Components

### shadcn inventory (mandatory)

Full nesting: [`shadcn.md`](./shadcn.md) SaaS routes. Do not invent a `.sf-*` kit.

| Component | Screen / region | Notes |
|---|---|---|
| `Sidebar` + `SidebarProvider` | All SaaS except `/saas/entrar` | `collapsible="offcanvas"`, `--sidebar-width: 240px`. No `SidebarRail` |
| `SidebarHeader` | Wordmark / 24px logo | Inter 16/600, `--sidebar-foreground` |
| `SidebarMenuButton` | Nav rows | 32–36px, 13/500, Lucide 16. `isActive`: 3px `--primary` bar + `bg-primary/8`, weight 600 |
| `SidebarFooter` | Role + Sair | `Badge` + `Button variant="ghost"`. Desktop **only** place for these |
| `SidebarTrigger` | Mobile 48–52px bar | Label `desk_menu` |
| `SidebarInset` | Canvas | `bg-background` (`#f3f3f3`) |
| `Button` `default` | List CTA, forward transitions, Salvar, Confirm apply | `size="default"` desktop; `h-[52px] w-full` warehouse |
| `Button` outline + destructive | Cancel when legal | Omit illegal — do not disable “sem permissão” |
| `Button` `ghost` | Sair, warehouse bottom tabs | Inactive tabs never `default` |
| `Button` `link` | Pedido id, SKU, Chat empty | First column 600 |
| `Select` | Pedidos status filter | Under title, not in a `Card` |
| `Table` | Pedidos, Estoque, Avisos, pedido lines, chat preview | White wrap `border #e8e8e8`, radius ≤4px, **no** `Card`, **no** `--shadow-card`. thead `#f7f7f7` / 40px |
| `Badge` | Status, canal, role, preview row action | Tones below. Not a 40px slab |
| `Breadcrumb` | Forms | `Pedidos / {id}`, `Estoque / {sku}` |
| `Switch` | `visivel_loja` on Estoque | Supervisor only. `aria-label="Visível na loja, SKU {code}"` |
| `RadioGroup` | `canais_aviso` | Configuração |
| `Field` + `Input` + `Textarea` | Login, novo, ajuste, tema, composer | Compact h-8 |
| `Card` | Login, warehouse/courier list-cards | **Not** list/form wraps |
| `Alert` | Entitlement, notify, cancelado, errors | No Conta href. Notify `aria-live="polite"` |
| `AlertDialog` | Despacho, cancel pedido, theme dirty | Not `Dialog` |
| `Popover` + `ScrollArea` | Customer search on novo | |
| `ScrollArea` | Chat thread | |
| `Skeleton` | List 6–8 rows / form blocks | Sidebar stays |
| `Separator` | Sidebar foot, form sections | |
| `sonner` | Illegal transition race | Toast + refresh |

**Do not use** on SaaS: `NavigationMenu`, `DropdownMenu`, `Tabs`, `Avatar`, `Pagination`, `Sheet` except via `Sidebar` mobile, `Dialog`.

### Composition (how those pieces nest)

```
SidebarProvider → Sidebar (header / menu / footer) + SidebarInset
  → mobile Menu bar
  → entitlement Alert
  → list: title + Button | sub | Select | div.border > Table
  → form: Breadcrumb | title + Badge | Button row | Separator sections
```

Warehouse card: `Card` → title + `Badge` → `Button h-[52px] w-full`. Chat preview: `Table` then **Confirmar aplicação** `Button default` + Descartar `outline` — never the composer submit.

### Anatomy rules (Desk)

| Piece | Rules |
|---|---|
| **Active nav** | 3px left primary + 8% wash only. Never fill the rail |
| **List header** | Title 18–20 / 600 left, CTA right, sub under, filters under that. Gap title→filter 12px. No uppercase kicker |
| **Trail** | 5 dots + connectors ~20px (Tailwind recipe). `cancelado` = interrupted + `Alert destructive` |
| **Form section** | h2 14/600 + `Separator`. No nested `Card`s |
| **Drop zone** | `Button outline` dashed, pad 32px |
| **Empty** | 56×56 white tile, muted title, optional primary `Button` |
| **Login `Card`** | White on `#f3f3f3` — see `entrar` |

### Status tag tones

| Status | Treatment |
|---|---|
| `novo` | Neutral outline (`#e8e8e8` + text) |
| `confirmado` | Primary fill + on-primary text |
| `separando` | Warning tint + warning text |
| `despachado` | Accent fill + on-accent text |
| `entregue` | Success tint + success text |
| `cancelado` | Danger outline |

Never color-only. Never rename.

---

## 7. Interaction behavior

- Nav: click closes mobile drawer. Active = `pathname` prefix of the item href (do not highlight Pedidos on `/saas/estoque`).
- List row: id / SKU is the link. Entire row may be clickable; do not add a button column.
- Filters are client-side on the loaded page unless the API already pages — do not invent a new search module.
- Legal transitions only. Omit, do not disable with “sem permissão”.
- After success: refresh record; show notify `aria-live="polite"` matching `canais_aviso`.
- Despacho: second tap in dialog. Separar / entregue: single tap. No undo.
- Chat: composer text never applies. Confirm button only. Descartar → “Nada foi aplicado.”
- Theme: live preview pane only; contrast gate blocks save. Dirty leave → `theme_dirty`.
- Config: cannot turn off the last of CPF/CNPJ.
- Entitlement: disable writes; keep reads; no Conta link.
- Focus: visible accent ring. Skip link `Ir para o conteúdo` unchanged.
- `prefers-reduced-motion: reduce`: duration 0; no translateY.

---

## 8. States

| State | Desk treatment |
|---|---|
| **Loading** | Sidebar stays. List: 6–8 skeleton rows 40px inside the white wrap. Form: title + 3 blocks. Chat parse: in-thread “Lendo o arquivo…” |
| **Empty** | Centered in the white body. Copy from `states.md`. Pedidos: primary `Novo pedido` if legal. Fila / Entregas / Avisos: title only. Estoque: Chat link for supervisor |
| **Error** | Inline in the white body: “Não foi possível carregar.” + `Tentar de novo`. Not a full-page illustration |
| **Forbidden screen** | Redirect role home. No upsell |
| **Illegal transition (race)** | Toast + refresh. Do not re-POST blindly |
| **Entitlement** | Banner + disabled writes + reason text |
| **Parse-error** | Preview row errors; Confirm applies valid rows only (label says so). Unreadable file: no preview |
| **Discard preview** | “Nada foi aplicado.” |
| **Theme contrast** | Inline; save disabled |
| **Success notify** | Success-tint banner, existing WhatsApp / e-mail sentences — not a chat bubble |
| **Masked IDs** | Lists, detail, outbox |

---

## 9. Responsive behavior

| Element | Desktop | Mobile |
|---|---|---|
| Sidebar | 240 sticky | Hidden; hamburger drawer |
| Top bar | **None** | 48–52px white, Menu only |
| Role + Sair | Sidebar foot | Drawer foot (same) |
| List table | Full | Horizontal scroll (supervisor / vendedor) |
| Warehouse list | Cards OK if used; table not required | **Cards required** |
| Form button row | Horizontal | Warehouse/courier: 52px stack, 12px gap |
| Tema | Fields + preview side by side ≥900 | Stack preview under fields |
| Chat | Thread + composer in one white column | Same; drop zone full width |
| Bottom bar | None | Estoquista / entregador only |
| Body type | 14px | Warehouse/courier 16px |
| Main pad | 24×32 | 16 |

What disappears on mobile: desktop sidebar, side-by-side tema preview.
What becomes sticky: top bar; warehouse bottom bar; not the list title.
What stays accessible: primary list CTA (wraps under title if needed, still visually a header action).

---

## 10. Tokens used

`[data-theme="tenant"]` + `[data-density="compact"]`.

### System chrome (hardcoded CSS — **not** theme-editor fields)

| Name | Hex | Use |
|---|---|---|
| Canvas | `#f3f3f3` | App chrome around white bodies (`#f5f5f5` acceptable alias) |
| Sidebar | `#fafafa` (or `#ffffff`) | Left rail |
| Hairline | `#e8e8e8` | Sidebar edge, table, form dividers, cards, inputs |
| Nav hover | `#f0f0f0` | Nav row, optional table hover |
| Thead / row hover | `#f7f7f7` | Table head, row hover, user chat |
| White body | `#ffffff` | List wrap, form, login card, list-cards |

### Tenant (editor)

`--color-primary`, `--color-accent`, `--color-background`, `--marca`, `--logo-url`.

`--color-background` (seed cream) does **not** paint the SaaS canvas. `--color-primary` does **not** paint the sidebar.

### Type (system)

Inter 400 / 500 / 600 / 700, latin + latin-ext. Fallback `Inter, ui-sans-serif, system-ui, sans-serif`.

| Role | Size / weight | Line-height |
|---|---|---|
| List / form title | 18–20px / 600 | 1.25 |
| Sidebar wordmark | 16px / 600 | 1.25 |
| Nav | 13px / 500 (600 active) | 1.35 |
| Body | 14px (16px warehouse phone) | 1.5 |
| Subtitle / breadcrumb / meta | 12–13px / 400 muted | 1.35 |
| Thead | 12px / 500 | 1.35 |
| Button / tag | 12–13px / 600 | 1.35 |
| Login kicker | 13px / 600 muted | 1.35 |
| Numeric | tabular-nums | — |

### Geometry

| Token | Value |
|---|---|
| Sidebar | 240px |
| Nav row | 32–36px |
| Table row | 40px |
| Compact control | 28–36px |
| Warehouse primary | 52px, gap 12px |
| Main max | 1120px |
| Radius | inputs/cards `--radius-md` (8). Table wrap ≤4px. **No** 16px+ blobs |
| Space | 4 / 8 / 12 / 16 / 24 / 32 |

### Elevation / motion

Lists and forms: **border only**. `--shadow-card` forbidden on the `Table` wrap and warehouse list-cards. Login may use `--shadow-sm`. `AlertDialog` `--shadow-float`. Duration 160–180ms. Reduced motion: 0.

---

## 11. Accessibility

- Contrast ≥ 4.5:1 on body, sidebar text on `#fafafa`, primary button (use `--color-text-on-primary`), tags.
- If tenant primary fails on white for **links**, derive a darker companion for text links; keep the raw primary for the 3px bar and filled buttons if those pass.
- Status and channel = text + color.
- Focus: 2px accent ring + 2px offset. Never `outline: none` without it.
- Warehouse / courier primaries ≥ 48×52, 12px gap.
- Nav `aria-label="SaaS"`. Bottom bar `aria-label="Fila"`. Breadcrumb `aria-label="breadcrumb"`.
- Notify and chat apply: `aria-live="polite"`.
- Switch name: `Visível na loja, SKU X`.
- Tax IDs masked; no full CPF/CNPJ in `title`, `alt`, or `aria-label`.
- Disabled writes: nearby reason text (entitlement, contrast, all-bad preview).
- Keyboard: skip → nav → main → actions. Dialogs trap focus.
- Empty / decorative tiles: `aria-hidden`.

---

## 12. Copy (pt-BR)

Use [`copy-pt-BR.md`](./copy-pt-BR.md). Desk chrome keys (`desk_*`, `col_*`, `filter_todos`, `history`, `load_more`) are listed there. **Do not rename** Novo / Confirmado / Separando / Despachado / Entregue / Cancelado.

Nav order unchanged:

| Role | Items |
|---|---|
| supervisor | Pedidos · Estoque · Chat de estoque · Tema · Configuração · Avisos |
| vendedor | Pedidos · Estoque · Avisos |
| estoquista | Fila do depósito · Estoque |
| entregador | Entregas |

Login kicker: `auth_kicker_saas` → **Acesso da equipe**.

Notify sentences unchanged. Entitlement strings unchanged. No “Ir para a Conta”.

---

## 13. Handoff to frontend

### Must implement

1. **Inter** (latin-ext) on all SaaS. `--font-display` / `--font-body` / `--font-ui` = Inter. No Fraunces / Geist.
2. **Shell:** `Sidebar` `#fafafa` + 1px `#e8e8e8`, `SidebarInset` canvas `#f3f3f3`, Lucide 16, hover `#f0f0f0`, active **3px primary + 8% wash**, role + Sair in `SidebarFooter`.
3. **No desktop top bar.** Mobile: 48–52px white + `SidebarTrigger` (same sidebar offcanvas). Warehouse/courier: ghost bottom `Button`s.
4. **List chrome:** title 18–20 left, `Button` right, `Select` under title, `Table` `#e8e8e8` / `#f7f7f7` / 40px, **no shadow**, **not** wrapped in `Card`.
5. **Form chrome:** `Breadcrumb`, title + **small** `Badge`, `Button` row, `Separator` sections. Optional compact trail.
6. **Login:** one white `Card` on gray, Inter, “Acesso da equipe”.
7. **Warehouse/courier:** `Card` 1px, 52px primary, 16px body `<768`.
8. **Chat:** `Table` preview + real Confirm `Button`. Composer never applies.
9. **Tema / Config:** white form; preview pane; no new editor fields. `Switch` / `RadioGroup` / `Select` as in `shadcn.md`.
10. **Avisos:** `Table`. No reenviar.
11. Role-aware nav. Zero billing. Entitlement `Alert` without Conta link.
12. Existing notify / status / empty copy. `visivel_loja` = `Switch` on Estoque only.

### Implementation order (exact)

Rebuild on shadcn. Do not restyle Store or Account in the same pass. Do not keep `.sf-*` primitives.

1. **Token mapping** for SaaS (`shadcn.md` §2) — canvas, sidebar, hairline, hover, thead. Not theme-editor JSON.
2. **Shell:** `SidebarProvider` / `Sidebar` / `SidebarFooter` / `SidebarInset` / mobile trigger + warehouse bottom bar (ghost inactive).
3. **Type:** compact titles 18–20, nav 13, no leftover kicker/uppercase on list headers.
4. **Login:** `/saas/entrar` = one `Card` on `#f3f3f3`.
5. **List header + filter:** title \| CTA, then `Select`, then `Table` wrap.
6. **Table:** 40px, `#f7f7f7` thead, no shadow, first-col 600, tabular money.
7. **Form:** `Breadcrumb`, title row + `Badge`, `Button` row, `Separator`. Apply to pedido, novo, SKU, tema, config.
8. **Pedido detail:** `Badge` + trail + `Table` — no status slab.
9. **Warehouse `Card`s + 52px hits + despacho `AlertDialog`.**
10. **Chat `ScrollArea` + drop zone + preview `Table` + Confirm `Button`.**
11. **Avisos + estoque columns** (`Switch` supervisor).
12. **Empty / `Skeleton` / entitlement / contrast** states.
13. **QA:** flip tenant primary — buttons, links, active bar follow; sidebar and canvas stay light. Account still navy. Store still Woo.

### Must not improvise

- Hierarchy, layout direction, or visual emphasis (no status hero slab, no painted sidebar, no card-dashboard).
- Spacing / type scale above (no Fraunces, no 28px SaaS display titles).
- Colors outside tokens + the system hex table. No cream canvas. No tenant background on Desk chrome. Do not map tenant `--color-accent` to shadcn `--accent`.
- New routes, dashboards, pessoas, pagamento, “ir para a conta”.
- Theme-editor fields (fonts, radius, dark mode, shadows).
- New component patterns (metric tiles, pill nav, kraft shadows, iMessage chat, `.sf-*` kit).
- Different primitives than `shadcn.md` (`Card` as list wrap, `DropdownMenu` user menu, apply via composer).
- Empty / error / entitlement treatments (no Conta link, no spinner-only page).
- Status label synonyms. Courier assignment / maps. Second stock column. Apply-from-chat-text.
- Billing in SaaS. Store or Account restyle “to match”.

If a decision is missing, return to Design.

### Existing components to reuse

shadcn names only: `sidebar`, `button`, `select`, `table`, `badge`, `breadcrumb`, `switch`, `radio-group`, `field`, `input`, `textarea`, `card`, `alert`, `alert-dialog`, `popover`, `scroll-area`, `skeleton`, `separator`, `sonner`.

Do not reuse Store product-card, Woo footer, or Account navy header inside SaaS.

### Token changes

None in the theme editor. Map to shadcn variables per [`shadcn.md`](./shadcn.md) / [`tokens.md`](./tokens.md). System hexes above are CSS-only.

### Install

None — `npx shadcn@latest add` is not required.

### New or modified components

No new product components and no new shadcn adds. Compose: sidebar foot, list header (Tailwind), `Table` wrap, form title row, login `Card`, warehouse `Card`, chat preview actions.

---

## 14. Self-critique

| Question | Verdict |
|---|---|
| Strong focal point? | Yes — white list/form on gray; button row on records |
| Hierarchy obvious in ~2s? | Yes — title / CTA / table or tag / actions |
| Distinctive decision? | Yes — Desk restraint vs painted rail and vs Woo shop |
| Avoids generic UI kit? | Yes if frontend does not reintroduce card grids |
| Typography doing work? | Yes — 18–20 / 13 / 12 Inter, no serif |
| Spacing intentional? | Yes — 8/12/16/24/32, 40px rows, 240 sidebar |
| Unnecessary cards? | Cards only for warehouse/courier lists and login |
| Primary action unmistakable? | List CTA right; form button row; 52px on device |
| Product personality? | Quiet ERP + tenant accent — not kraft, not navy |
| Designed without decoration? | Yes — hairlines and type |
| Mobile designed? | Warehouse bottom bar + 52px; supervisor scroll — not a stacked desktop |
| Density appropriate? | Compact 14px / 40px; 16px on warehouse phones |

No cluster of negatives. Operational screens do not need spectacle.

### Quality score

| Criterion | Score | Note |
|---|---|---|
| Usability | 9/10 | Role homes, legal actions only, large warehouse hits |
| Visual hierarchy | 9/10 | Title / CTA / table; tag not slab |
| Visual impact | 7/10 | Intentional quiet Desk — not a customer surface |
| Originality | 7/10 | Familiar ERP language by design, not a new fashion |
| Typography | 8/10 | Inter scale locked; no display serif |
| Brand personality | 8/10 | Tenant primary as action accent; Norte seed still visible on buttons |
| Responsive quality | 9/10 | Two shells: Desk table vs warehouse cards |
| Accessibility | 9/10 | Contrast, hits, live regions, text+color status |
| Design-system consistency | 9/10 | One Desk language across ten screens |

Usability, hierarchy, responsive, and accessibility are ≥8. Visual impact / originality sit at 7 because this is an operational desk, not a Store hero.

---

## Unresolved design questions

None that block frontend. Product locks stay closed (status machine, no billing in SaaS, AI confirm button, outbox stub).
