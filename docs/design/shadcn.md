# shadcn/ui kit — implementation source of truth

Frontend rebuilds **Store**, **SaaS**, and **Account** from this file. Surface chrome, IA, and copy stay in [`visual.md`](./visual.md), [`store.md`](./store.md), [`saas-desk.md`](./saas-desk.md), [`account.md`](./account.md), [`copy-pt-BR.md`](./copy-pt-BR.md), [`states.md`](./states.md). Product locks stay in [`../product/spec.md`](../product/spec.md).

This file owns **which shadcn primitives compose each existing route**, how tenant tokens map onto shadcn CSS variables, and what frontend must not invent.

Installed in `apps/web` (`components.json`: style **radix-nova**, Tailwind v4, `src/components/ui/`). Lucide icons only.

**Do not invent a parallel CSS kit.** No new `.sf-btn`, `.sf-table`, `.sf-product-card`, or other primitive class names. Layout chrome (Woo header, Desk canvas, Account navy bar, product photo tile, status trail) is **Tailwind utilities around these primitives**.

No new routes, modules, theme-editor fields, billing in SaaS, ops nav in Account, or Store→SaaS links. SaaS chrome has a **user** color-mode preference (light / dark / system). That is not a tenant theme-editor field.

---

## 1. Three chromes (unchanged)

| Surface | Base | Feel | Type | Tenant theme? |
|---|---|---|---|---|
| **Store** `/loja` | WordPress WooCommerce Storefront | White shop, utility bar + cart header, square tiles, dark footer | Inter | Yes — tints prices, buttons, optional 36px utility strip. **Not** the page. |
| **SaaS** `/saas` | shadcn/studio admin (AdminCN craft) | Dark zinc shell, grouped sidebar, KPI cards from real counts, tables in rounded cards | Inter | Yes — tints **buttons and KPIs only**. Never paints the sidebar. |
| **Account** `/conta` | Product navy | `#1E3A5F` header on `#F4F6F8`, one billing card | IBM Plex Sans | **Never** |

Seed tenant Norte Atacado: primary `#0F4F3E`, accent `#C2410C`, background `#F6EFE3`.

`--font-sans` → Inter on `[data-theme="tenant"]`, IBM Plex Sans on `[data-theme="product"]`. Do not use Geist, Fraunces, or Source Serif 4 as the product face. SaaS compact chrome is studio in **light or dark**. Color mode is a per-browser preference (`Claro` / `Escuro` / `Automático`), default **Claro**. Store and Account stay light. Leave tenant-editable dark mode out of the theme module.

---

## 2. Token mapping

Tenant tokens (`--color-primary`, `--color-background`, …) remain the **editor contract**. shadcn primitives read **shadcn variables** (`--primary`, `--background`, …). Frontend maps them **per surface**, not with one global assignment.

**Critical:** shadcn `--accent` is a **muted hover wash**, not tenant terracotta. Tenant `--color-accent` must **not** overwrite `--accent`, or every hover/menu becomes terracotta.

Introduce one **brand** alias (not a theme-editor field):

| Brand alias | Source | Use |
|---|---|---|
| `--brand-accent` | tenant `--color-accent` / product `#3D6B8C` | Atacado `Badge`, MOQ hint, Store/SaaS **focus `--ring`**, optional 36px utility mix |
| `--brand-accent-foreground` | `--color-text-on-accent` | Text on Atacado fill |

### Shared mapping (all surfaces)

| Tenant / system | shadcn variable | Notes |
|---|---|---|
| `--color-primary` | `--primary` | Buttons `variant="default"`, links, Store prices |
| `--color-text-on-primary` | `--primary-foreground` | Contrast gate ≥ 4.5:1 |
| `--color-text` | `--foreground` | Body |
| `--color-text-muted` | `--muted-foreground` | Meta, SKU, kickers |
| `--color-danger` | `--destructive` | Cancelado, errors, Account cancel |
| `--color-surface-raised` / `#fff` | `--card`, `--popover` | Cards, dialogs, menus |
| `--color-text` | `--card-foreground`, `--popover-foreground` | |
| System `#e8e8e8` (shop/desk hairline) | `--border`, `--input` | **Do not** use tenant cream `--color-border` on shop or Desk chrome |
| `--brand-accent` | `--ring` | Focus ring (tenant terracotta / Account steel) |
| `--radius-md` `8px` | `--radius` | Override radix-nova default `0.625rem`. Tables ≤ 4px via class |
| `--font-ui` | `--font-sans` | Inter tenant / Plex product |
| `--color-success` | (utility classes) | `entregue`, `ativa` — no shadcn `--success`; tint `Badge` / `Alert` with the system hex |
| `--color-warning` | (utility classes) | `separando`, entitlement, `inadimplente` |

`--secondary` / `--secondary-foreground` = light wash + ink (`#f5f5f5` / `--foreground`) for `Button variant="secondary"` if used. Prefer `outline` / `ghost` for secondary actions.

`--muted` = thead / chat user bubble / subtle wells — **not** tenant cream.

### Store `[data-theme="tenant"][data-density="comfortable"]`

| shadcn | Value | Why |
|---|---|---|
| `--background` | `#ffffff` | Shop page is white. **Not** `--color-background`. |
| `--foreground` | `--color-text` | |
| `--primary` | `--color-primary` | Prices + filled buttons |
| `--primary-foreground` | `--color-text-on-primary` | |
| `--card` | `#ffffff` | Product / auth / cart lines |
| `--muted` | `#f5f5f5` | Auth canvas optional; toolbar well |
| `--muted-foreground` | `--color-text-muted` | `shop_showing` |
| `--border` / `--input` | `#e8e8e8` | Woo hairline |
| `--ring` | `--color-accent` | Terracotta focus |
| `--destructive` | `--color-danger` | |
| `--sidebar*` | unused | Store has no `Sidebar` |

Apply `--color-background` (seed cream) **only** on the optional 36px utility strip (`bg-[var(--color-background)]`). Footer is system `#2c2d33` (not a token).

### SaaS `[data-theme="tenant"][data-density="compact"]`

Studio chrome. **Light is default.** `html.dark` (user preference Claro / Escuro / Automático) switches zinc. Not a theme-editor field.

| shadcn | Light | Dark (`html.dark`) |
|---|---|---|
| `--background` | `#f4f4f5` | `#0c0c0e` |
| `--foreground` | `#09090b` | `#f4f4f5` |
| `--primary` | `--color-primary` | mix toward white |
| `--primary-foreground` | `--color-text-on-primary` | `#09090b` |
| `--card` | `#ffffff` | `#141416` |
| `--muted` | `#ececee` | `#1c1c1f` |
| `--muted-foreground` | `#71717a` | `#a1a1aa` |
| `--border` / `--input` | `#e4e4e7` | `#27272a` |
| `--ring` | `--color-accent` | mix toward white |
| `--radius` | `0.75rem` | same |
| `--sidebar` | `#ffffff` | `#09090b` |
| `--sidebar-foreground` | `#09090b` | `#fafafa` |
| `--sidebar-accent` | `#f4f4f5` | `#18181b` |
| `--sidebar-border` | `#e4e4e7` | `#18181b` |

`--color-background` does **not** paint the canvas. `--sidebar-width: 16rem` on `SidebarProvider`. Color mode control: header `DropdownMenu` + login corner. Store / Account never get `html.dark`.

### Account `[data-theme="product"][data-density="comfortable"]`

| shadcn | Value | Why |
|---|---|---|
| `--background` | `#F4F6F8` | Product stage |
| `--foreground` | `#142033` | |
| `--primary` | `#1E3A5F` | Navy header + primary actions |
| `--primary-foreground` | `#F4F6F8` | Inverse nav |
| `--card` | `#ffffff` | Billing + login cards |
| `--muted` | `#E8EEF2` | Subtle wells |
| `--muted-foreground` | `#5B6573` | |
| `--border` / `--input` | `#D5DCE3` | Product hairline |
| `--ring` | `#3D6B8C` | Product accent |
| `--destructive` | `#B42318` | Cancelar assinatura |
| `--sidebar*` | unused | |

**Never** read tenant CSS variables on `/conta`. QA: change Norte primary → Account stays navy/gray.

### Live theme preview (SaaS `/saas/tema`)

Preview iframe / pane sets the **same Store + SaaS mapping** on a framed `data-theme="tenant"` root. Changing fields updates CSS variables **inside the pane only**. The Desk shell around the editor does not hot-swap until **Salvar tema**. Preview must include: `Button` default + outline, price-like primary text, `Badge` status, active nav row (3px bar), `Table` snippet. Not swatches only.

Contrast gate: `--foreground` on chosen `--color-background`, and `--primary-foreground` on `--primary`, ≥ 4.5:1. Fail → `FieldError`, save `Button` disabled.

### What this mapping forbids

- Assigning tenant `--color-background` to shadcn `--background` on Store or SaaS.
- Assigning tenant `--color-accent` to shadcn `--accent`.
- Assigning `--color-primary` to `--sidebar`.
- Using `--color-border` cream on Store header hairline.
- Shipping a tenant-editable dark mode or extra editor fields for fonts/radius/shadows. SaaS color mode is a **user** preference (Claro / Escuro / Automático), not a theme-module field.

---

## 3. Installed inventory (use only these)

| Primitive | File | Allowed on MVP? |
|---|---|---|
| `button` | `button.tsx` | **Yes** — every action |
| `input` | `input.tsx` | **Yes** — text, email, password, number, color, file |
| `label` | `label.tsx` | Prefer `field` (`FieldLabel`) |
| `textarea` | `textarea.tsx` | Chat composer, ajuste motivo, chat instruction |
| `select` | `select.tsx` | Pedidos status filter, vendedor padrão, canais if not radio |
| `checkbox` | `checkbox.tsx` | Installed; **do not use** (flags are `switch` / `radio-group`) |
| `radio-group` | `radio-group.tsx` | CPF\|CNPJ, `canais_aviso` |
| `switch` | `switch.tsx` | `visivel_loja`, `aceita_cpf`, `aceita_cnpj` |
| `card` | `card.tsx` | Store product/auth/empty tile, SaaS login + warehouse cards, Account card. **Not** SaaS list wraps |
| `table` | `table.tsx` | Store cart desktop, meus pedidos; all SaaS desk lists |
| `badge` | `badge.tsx` | Status, Varejo/Atacado, role chip, cart count, outbox |
| `dialog` | `dialog.tsx` | Installed; **do not use** — confirms are `alert-dialog` |
| `alert-dialog` | `alert-dialog.tsx` | Despacho, cancel pedido, theme dirty, Account flag |
| `sheet` | `sheet.tsx` | **Only** via `Sidebar` mobile offcanvas. No Store cart sheet |
| `sidebar` | `sidebar.tsx` | **SaaS shell only** |
| `breadcrumb` | `breadcrumb.tsx` | Store PDP + pedido detail; SaaS forms |
| `alert` | `alert.tsx` | Entitlement, registry-down, notify, cancelado, price-changed, errors |
| `skeleton` | `skeleton.tsx` | Loading bodies (chrome stays) |
| `separator` | `separator.tsx` | Sidebar foot, form sections, footer columns |
| `dropdown-menu` | `dropdown-menu.tsx` | **SaaS color mode only** (Claro / Escuro / Automático). Never a user menu with Conta / billing. |
| `sonner` | `sonner.tsx` | Race 409, generic save/load toast |
| `avatar` | `avatar.tsx` | Installed; **do not use** (wordmark / logo `<img>`, not avatars) |
| `navigation-menu` | `navigation-menu.tsx` | Installed; **do not use** (Woo header is `Button` links, not a mega-menu) |
| `scroll-area` | `scroll-area.tsx` | Chat thread; customer-search results |
| `tooltip` | `tooltip.tsx` | Installed; unused (sidebar does not collapse) |
| `tabs` | `tabs.tsx` | Installed; **do not use** (auth is two routes; document type is `radio-group`) |
| `popover` | `popover.tsx` | Customer search on `/saas/pedidos/novo` |
| `field` | `field.tsx` | Every form |
| `pagination` | `pagination.tsx` | Installed; **do not use** (`load_more` is a `Button`) |
| `collapsible` | `collapsible.tsx` | Installed; **do not use** (form sections stay open) |

### Extra packages

**None.** Do not run `npx shadcn@latest add …` for MVP.

Compose customer search with `Input` + `Popover` + `ScrollArea` + `Button`. Compose qty stepper with `Button size="icon"` + `Input`. Compose status trail with spans + Tailwind (not `progress`). Compose photo tiles with a `div` (not a new media component).

If a future screen truly needs a missing primitive, return to Design — do not add `command`, `form`, `drawer`, `toggle-group`, or `calendar` in this rebuild.

---

## 4. Global composition rules

### Button

radix-nova sizes: `xs` h-6 · `sm` h-7 · `default` h-8 · `lg` h-9. Override height with Tailwind when the surface requires it — **do not fork the primitive**.

| Surface / role | variant | size / class |
|---|---|---|
| SaaS desktop primary (Novo pedido, Confirmar, Salvar) | `default` | `default` (32px) — matches Desk 28–32 |
| SaaS desktop cancel | `outline` + `className="border-destructive text-destructive hover:bg-destructive/10"` | `default` |
| SaaS ghost (Sair, filter-adjacent) | `ghost` | `sm` or `default` |
| SaaS link (id, SKU) | `link` or `<a className="font-semibold text-primary">` | — |
| Warehouse / courier primary `<768` | `default` | `className="h-[52px] w-full"` |
| Store card **Adicionar** | `outline` + `className="border-primary text-primary h-10 w-full sm:h-11"` | same on every card |
| Store PDP / cart finalize | `default` | `className="h-11"` |
| Store header Cadastrar | `default` | `sm` |
| Store header Entrar / Sair / nav | `ghost` | `default` |
| Store header Carrinho | `ghost` | `default` + `Badge` count |
| Account actions | `default` / `outline` / destructive outline | `className="h-11 w-full"` |

Disabled writes (entitlement, sem estoque, all-bad preview): `disabled` + **nearby reason text**. Hover: primary `color-mix(in srgb, var(--primary) 88%, #000)` is already `hover:bg-primary/80`. Active: primitive already `translate-y-px`. `prefers-reduced-motion: reduce` → duration 0 (global CSS).

**Do not** use `variant="destructive"` as a filled red slab for cancel — use outline + destructive color. Account **Cancelar assinatura** may use `variant="destructive"` (soft fill) because the confirm lives in `AlertDialog`.

### Input / Field

Every labeled control:

```
<Field>
  <FieldLabel>…</FieldLabel>
  <Input /> or <Textarea /> or <Select>…
  <FieldDescription> optional
  <FieldError> on invalid
</Field>
```

- SaaS: default `Input` h-8 (compact). Store / Account: `className="h-11"`.
- Labels always visible — never placeholder-only.
- `aria-invalid` + `FieldError` for checksum / MOQ / contrast.
- Native `<input type="color">` inside `Field` for theme primary/accent/background — no extra color picker package.
- Native `<input type="file" accept=".csv,.xlsx">` for chat — hide the default control if needed; the drop zone is a dashed Tailwind button that triggers it.

### Badge (status + channel)

Never color-only. Never rename Novo / Confirmado / Separando / Despachado / Entregue / Cancelado.

| Status | `Badge` variant + class |
|---|---|
| `novo` | `outline` |
| `confirmado` | `default` (primary fill) |
| `separando` | `secondary` + `className="bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-transparent"` |
| `despachado` | `className="bg-[var(--brand-accent)] text-[var(--brand-accent-foreground)] border-transparent"` |
| `entregue` | `secondary` + `className="bg-[var(--color-success)]/15 text-[var(--color-success)] border-transparent"` |
| `cancelado` | `destructive` |

Channel: **Varejo** = `outline` + `border-primary text-primary`. **Atacado** = fill `--brand-accent`. Role chip (sidebar): same Atacado treatment (`Supervisora` / `Vendedor` / …). Cart count: `secondary` or `default`, adjacent to Carrinho — not a lone number.

Outbox row status: `pendente` outline · `enviado` success tint · `falha` `destructive`.

Account plan: `ativa` success tint · `inadimplente` warning tint · `cancelada` `destructive`. Hero on Account = **larger** Badge (`className="h-8 px-3 text-sm"`) — still a `Badge`, not a slab of custom CSS.

### Card

Default primitive is `rounded-xl` + ring. Override:

| Use | className |
|---|---|
| Store product | `gap-0 py-0 rounded-lg shadow-[var(--shadow-card)] ring-[#e8e8e8] hover:shadow-[var(--shadow-card-hover)]` (`pointer: fine` only for hover lift) |
| Store / SaaS / Account auth | `rounded-lg p-8 shadow-[var(--shadow-card)] ring-[#e8e8e8] max-w-[420px]` |
| Account billing | `rounded-lg p-8 shadow-[var(--shadow-card)] max-w-[480px]` |
| Warehouse list-card | `rounded-lg shadow-none ring-1 ring-[#e8e8e8] py-4` |
| SaaS list / form body | **Do not use `Card`.** White `div` + `border border-[#e8e8e8] bg-card rounded-sm` (radius ≤ 4px, **no** `--shadow-card`) |

### Table

```
<div className="overflow-x-auto rounded-sm border border-[#e8e8e8] bg-card">
  <Table>
    <TableHeader className="bg-[#f7f7f7] [&_tr]:h-10">
    <TableBody className="[&_tr]:h-10">
```

First data column `font-semibold`. Money `tabular-nums text-right`. Row hover `bg-muted`. Open record via the id/SKU link — **no** “Abrir” column. Store cart desktop uses the same `Table`; mobile cart is stacked `div`s, not a table.

### Alert / AlertDialog / Sonner

| Event | Primitive |
|---|---|
| Entitlement Store cart / SaaS every screen | `Alert` + warning utilities. **No** `/conta` href |
| Registry-down, price-changed, notify after transition | `Alert` (`aria-live="polite"` on notify) |
| `cancelado` on pedido | `Alert variant="destructive"` |
| Load error in body | `Alert` + `Button` Tentar de novo |
| Despacho / cancel pedido / theme dirty / Account flags | `AlertDialog` |
| Illegal transition race (409) | `toast` from `sonner` + refresh |

One `<Toaster />` (`sonner`) in the app shell. Do not toast entitlement or chat apply — those are in-page `Alert`s.

### Sidebar vs Sheet

- **SaaS desktop:** `SidebarProvider` + `Sidebar` `collapsible="offcanvas"` `variant="sidebar"`. No `SidebarRail`. No icon-collapse. `--sidebar-width: 240px`.
- **SaaS mobile:** the same `Sidebar` renders as an offcanvas `Sheet` (built in). Trigger = `SidebarTrigger` labeled `desk_menu` (“Menu”) in a 48–52px white top bar. Drawer language = light sidebar, **not** a dark sheet.
- **Store / Account:** no `Sidebar`, no `Sheet`.

### Focus / a11y

Visible ring from `--ring` (already `focus-visible:ring-3`). Do not `outline-none` without it. Hits: Store ≥ 44px, warehouse/courier ≥ 48×52, 12px gap. Status + channel = text + color. Tax IDs masked; never full CPF/CNPJ in `aria-label` / `title` / `alt`. Skip link “Ir para o conteúdo” unchanged. Decorative photo tiles / empty art: `aria-hidden`.

---

## 5. Shared non-primitive recipes (Tailwind only)

These are **not** new kit components. Compose once and reuse.

### Product photo tile

No SKU images in the API. Square `aspect-square` `div`:

- Background `linear-gradient(152deg, var(--primary) 0%, color-mix(in srgb, var(--brand-accent) 52%, var(--primary)) 100%)`
- Optional 8% white radial top-left
- Initials: first letter of the first two words of `nome` (skip DE, DA, DO, DOS, DAS, E). One word → first two letters. Inter 600, `--primary-foreground`, ~28% of media height (PDP ~32%, cart 48×48 ~14px)
- `aria-hidden="true"`

Catalog `Skeleton` **must** include a 1:1 block so the grid does not jump.

### Status trail (SaaS / Store pedido detail)

Five dots + connectors, ~20px. Done = `--primary` fill; current = primary + 2px ring; future = muted border. `cancelado` = interrupted + `Alert variant="destructive"`. Optional; never a giant slab.

### Qty stepper

`Button size="icon"` minus · `Input` (number, `className="h-11 w-14 text-center"` on Store / `h-8 w-12` on SaaS) · `Button size="icon"` plus. Store 44×44 hits. CNPJ min = MOQ.

### CPF | CNPJ switch

`RadioGroup` horizontal. Only if both `aceita_cpf` and `aceita_cnpj`. Last remaining config flag uses `Switch` disabled + `FieldDescription` `last_flag`. Active radio visually fills `--primary` (Tailwind on `RadioGroupItem` / adjacent label). One `Input` for the document.

### Entitlement banner

`Alert` full-bleed under Store header / SaaS `SidebarInset` top. Copy from `copy-pt-BR.md`. Disable writes; do not remove reads. **No** Account link.

---

## 6. Per-route inventory

Conceptual bases: `/loja`, `/saas`, `/conta`. Only existing routes.

---

### Store shell (all `/loja/*` except full-bleed auth may keep footer)

`[data-theme="tenant"][data-density="comfortable"]`

| Region | Primitive | Composition |
|---|---|---|
| Optional utility 36px | — | Tailwind bar `h-9 bg-[var(--color-background)]`; `marca` Inter 12–13/600. No nav. No phone. |
| Header | `Button`, `Badge` | Sticky white `h-16` / mobile `h-14`, `border-b border-[#e8e8e8]`. Left: logo 32px or wordmark Inter 18–20/600. Nav: `Button variant="ghost"` Catálogo (+ Meus pedidos when logged in). Current: `font-semibold` + `underline decoration-2 underline-offset-4 decoration-primary`. Right: Carrinho `Button variant="ghost"` + `Badge` (`cart_itens` / `cart_item_one` visible or `aria-label`). Cadastrar `Button variant="default" size="sm"`. Entrar `Button variant="ghost"`. Logged-in: Meus pedidos ghost, Sair ghost. **No** SaaS/Account links. Hits ≥ 44px on small viewports. |
| Mobile header | same | Brand left; Carrinho + auth right; Catálogo / Meus pedidos wrap second row. **Do not** hide cart. **Do not** use `Sheet` / hamburger. |
| Footer | `Separator`, `Button variant="link"` | `#2c2d33`, pad 40×24, text `#f0f0f1`. 3–4 columns: `marca` · Loja (Catálogo, Carrinho) · Minha conta (Entrar/Cadastrar or Meus pedidos/Sair). Stack one column on mobile. No SaaS/Account. No phone/social. |
| Skip link | `Button variant="link"` | Unchanged |

---

### `/loja` — Catálogo

| Region | Primitive | Notes |
|---|---|---|
| Toolbar | — | Left: `shop_showing` / `shop_showing_one` 14px `text-muted-foreground`. Under: `catalog_lede_*` 13px. **No** Fraunces hero. |
| Grid | `Card` × N | 2 / 3 / 4 cols, gap 16–20, main max 1200px, pad 24 / 16. |
| Tile media | recipe | 1:1 photo tile. |
| Title | `CardContent` + `<a>` | 16px Inter 600, 2-line clamp → PDP. |
| Price | — | 16–18px / 600 tabular `text-primary`. |
| Meta | `Badge` | Varejo outline **or** Atacado fill + `Qtd. mín. N un` text. Stock meta 13px. |
| CTA | `Button variant="outline"` | **Adicionar** every card. Sem estoque: tile 70% opacity, CTA `disabled`, reason on the button. |
| Added | — | 13px success under button, `aria-live` — **not** `sonner`. |
| Empty | `Card` optional 72×72 tile | Copy `empty_catalog`. No CTA (supervisor must toggle). |
| Loading | `Skeleton` | 8 cards with 1:1 media. Header stays. |
| Error | `Alert` + `Button` | Tentar de novo. |

---

### `/loja/produto/[id]` — PDP

| Region | Primitive | Notes |
|---|---|---|
| Crumb | `Breadcrumb` | Início / Catálogo / Nome (`breadcrumb_inicio`, `nav_catalogo`). |
| Layout | — | Desktop media ~48% left, summary right. Mobile stack. |
| Media | recipe | Square tile, initials ~32%. |
| Title | — | Inter 24–28 / 600. |
| Price + chip | `Badge` | 24px tabular `text-primary` + Varejo/Atacado. |
| Stock | — | Disponível N or Sem estoque. |
| Qty | stepper recipe | 44×44. |
| Add | `Button variant="default" className="h-11"` | Disabled + reason if no stock / entitlement finalize lives on cart. |
| Not found | `Alert` + `Button variant="link"` | `pdp_unavailable` → catálogo. |
| Loading | `Skeleton` | Media square + 4 lines. |

No description, related products, shipping.

---

### `/loja/carrinho`

| Region | Primitive | Notes |
|---|---|---|
| Title | — | Carrinho 24/600 + optional `cart_itens`. |
| Lines desktop | `Table` | 48px tile · name · unit + `Badge` · stepper · subtotal · `Button variant="ghost"` remover. |
| Lines mobile | stacked `div` | Stepper + remove `h-11 w-full`. |
| Footer | `Button` | Sticky on mobile. Total 20/600 tabular. Logged-in + `ativa`: **Finalizar pedido** `default h-11`. Guest: **Entrar para pedir** primary + Cadastrar `outline`. |
| Entitlement | `Alert` | `store_blocked_inadimplente` **or** `store_blocked_cancelada`. Submit **omitted**. |
| Guest hint | `Alert` | `guest_hint`. |
| Price changed | `Alert` | After login reprice. |
| MOQ / zero stock | `FieldError` on line | Block submit. |
| Empty | recipe + `Button variant="link"` | `empty_cart` · Ver catálogo. |

---

### `/loja/entrar` · `/loja/cadastro`

| Region | Primitive | Notes |
|---|---|---|
| Stage | — | `#fff` or `#f5f5f5`. Centered. |
| Card | `Card` | max 420px, pad 32. Kicker `auth_kicker_store` 13 muted. Title `auth_my_account` / Entrar / Cadastrar Inter 22/600. **No** Fraunces wordmark. |
| Document | `RadioGroup` + `Input` `h-11` | Segment only if both flags. |
| CNPJ extras | `Field` + `Alert` | Loading `cnpj_loading`; filled `cnpj_filled`; registry-down `Alert` warning, submit allowed. |
| Password | `Field` + `Input type="password"` `h-11` | |
| Submit | `Button variant="default" className="h-11 w-full"` | Criar conta / Entrar. |
| Switch screen | `Button variant="link"` | To the other auth route. |
| Checksum | `FieldError` | `checksum_invalid`. |

---

### `/loja/pedidos` · `/loja/pedidos/[id]`

| Region | Primitive | Notes |
|---|---|---|
| List rows | `Table` or 1px stacked rows | Number 600, date muted, `Badge` status, total tabular. |
| Empty | — | `empty_orders` + Ver catálogo. |
| Detail crumb | `Breadcrumb` | Início / Meus pedidos / {id}. |
| Status | `Badge` + optional trail | **Small tag**, comfortable density — not a giant hero slab. `cancelado` = `Alert variant="destructive"`. |
| Lines | `Table` | Frozen prices + channel `Badge`. |
| History | 1px rows | Status label · date. |
| Document | — | Masked only. No notify controls. |
| Guest | redirect | Entrar + return URL. |
| Other customer | same as not found | `order_not_found`. |

---

### SaaS shell (all `/saas/*` except `/saas/entrar`)

`[data-theme="tenant"][data-density="compact"]`

```
<SidebarProvider style={{ "--sidebar-width": "16rem" }}>
  <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
    <SidebarHeader> AdminCN brand: SidebarMenuButton size=lg, 32px filled circular mark + marca (text-lg/semibold) + auth_kicker_saas (text-xs/light); mark only when collapsed
    <SidebarContent>
      <SidebarGroup> Operação
        Pedidos · Estoque · Chat (role-filtered)
      <SidebarGroup> Casa
        Tema · Configuração · Avisos (role-filtered)
    <SidebarFooter>
      <Separator />
      Avatar initial + role + marca
  <SidebarInset className="bg-background">
    sticky header: SidebarTrigger · Breadcrumb (group / page) · role chip · Sair
    {entitlement Alert}
    {page}
```

| Region | Primitive | Notes |
|---|---|---|
| Nav groups | `SidebarGroup` + `SidebarGroupLabel` | **Operação** / **Casa**. Hide empty groups. Uppercase 11px tracking. |
| Nav items | `SidebarMenuButton` | Role-filtered only. Active = pathname **prefix of that item**. Active = `bg-sidebar-accent`, rounded-lg. Hover `--sidebar-accent`. **Never** fill the rail with primary. |
| Icons | Lucide | Pedidos list · Estoque package · Chat bubble · Tema palette · Config sliders · Avisos bell · Fila warehouse · Entregas truck. |
| Identity | `Avatar` | **SidebarFooter** — role + marca. Not a billing user menu. |
| Desktop top bar | `SidebarTrigger` + `Breadcrumb` + `DropdownMenu` + `Button` | Sticky 56px. Aparência (Claro/Escuro/Automático). Sair ghost. Role chip outline. **No** Conta. |
| Mobile top | same header | Trigger opens offcanvas. |
| Warehouse bottom bar | `Button variant="ghost"` | Sticky; estoquista: Fila · Estoque. Entregador: Entregas. Active = `secondary`. Inactive **ghost**. |
| Entitlement | `Alert` | Every screen. Writes disabled. No Conta href. |
| List header | — | Title 24/600 tracking-tight left, CTA `Button` right, `saas_sub_*` 14 muted, filters under that. |
| KPI row | `Card` | Pedidos + Estoque only. Counts from **loaded** records. No fake WoW, no charts, no new routes. Clicking a Pedidos KPI sets the status filter. |
| Form header | `Breadcrumb` + `Badge` + `Button`s | Title + small status tag; button row under. |
| Nav order | — | supervisor: Pedidos · Estoque · Chat de estoque · Tema · Configuração · Avisos. vendedor: Pedidos · Estoque · Avisos. estoquista: Fila do depósito · Estoque. entregador: Entregas. **Zero** Assinatura / Plano / Conta. |

`/saas` itself redirects to the role home (Pedidos / Fila / Entregas). KPI cards are **not** a dashboard route.

---

### `/saas/entrar`

| Region | Primitive | Notes |
|---|---|---|
| Stage | — | `min-h-dvh bg-background` (`#0c0c0e`). No sidebar. |
| Card | `Card` | max 420px, pad 32, rounded-2xl, no cream radial. |
| Kicker | `CardDescription` | `auth_kicker_saas` — Acesso da equipe. 13px. No uppercase tracking. |
| Marca | — | Inter 16–18/600. |
| Title | `CardTitle` | Entrar 20/600. |
| Fields | `Field` + `Input` | e-mail, senha. Compact h-8. |
| Submit | `Button variant="default" className="w-full"` | Entrar. |
| Forbidden Account users | — | This is a **different** surface; no Conta link. |

---

### `/saas/pedidos` (supervisor / vendedor)

| Region | Primitive | Notes |
|---|---|---|
| Title / CTA | `Button variant="default"` | Novo pedido right. Hide if role cannot create or entitlement lock. |
| KPI | `Card` | Four tiles from loaded counts: Novos, Separando, Despachados, Entregues. Click sets status filter. No invented % deltas. |
| Sub | — | `saas_sub_pedidos`. |
| Filter | `Field` horizontal + `Select` | Label `Status`. Items: Todos + six status labels. Under title, not in a card. Trigger compact. |
| Body | `Table` inside rounded `bg-card` wrap | Pedido (link 600), Cliente (name · masked), Status `Badge`, Total tabular right, Atualizado. |
| Empty | `Button` | `empty_orders` + Novo pedido if legal. 56×56 white tile optional. |
| Loading | `Skeleton` | 6–8 rows 40px inside the white wrap. |
| Error | `Alert` + `Button` | |

Estoquista title **Fila do depósito**; filter locked; **cards** (below). Entregador title **Entregas**; same.

---

### `/saas/pedidos` (estoquista / entregador) — list-cards

| Region | Primitive | Notes |
|---|---|---|
| Card | `Card` | `{id} · {first name}` 18/600. `Badge` status. Primary `Button className="h-[52px] w-full"` when legal (Separar / Despachar / Marcar entregue). `entregue` = read-only. |
| Empty | — | `empty_warehouse` / `empty_courier` — title only. |
| `<768` | required cards | Do not use a table as the only view. |
| ≥768 | cards OK | Do not switch supervisor/vendedor to cards. |

---

### `/saas/pedidos/novo`

| Region | Primitive | Notes |
|---|---|---|
| Crumb | `Breadcrumb` | Pedidos / Novo pedido. |
| Title / CTA | `Button` | Criar pedido in the button row. |
| Sub | — | `saas_sub_novo`. |
| Cliente | `Field` + `Input` + `Popover` + `ScrollArea` | Search name / masked doc. Results = `Button variant="ghost" className="w-full justify-start"`. |
| Lines | `Select` or search `Input` + qty stepper + `Button` Adicionar item | |
| Table | `Table` | nome, qty, unit price **read-only**, Varejo\|Atacado `Badge` + MOQ. |
| MOQ | `FieldError` | Block submit under min. |
| Payment | — | **None.** |

---

### `/saas/pedidos/[id]`

| Region | Primitive | Notes |
|---|---|---|
| Crumb | `Breadcrumb` | Pedidos / {id}. |
| Title | — | `{id}` 18–20/600. |
| Status | `Badge` | Small tag. Optional trail. **Not** a hero slab. |
| Actions | `Button` | **Legal only** — omit illegal (do not disable “sem permissão”). Primary = forward. Cancel = destructive outline. Warehouse/courier mobile: stack `h-[52px] w-full` gap-3. |
| Despacho | `AlertDialog` | `confirm_dispatch`. |
| Cancel | `AlertDialog` | `cancel_confirm`. |
| Notify | `Alert` `aria-live="polite"` | After success only. `canais_aviso` sentences + “Vendedor avisado no mesmo canal.” |
| Cancelado | `Alert variant="destructive"` | Trail interrupted. |
| Itens | `Table` | nome, qty, unit, `Badge`, line total. Section label 14/600 + `Separator`. |
| Cliente | — | name · masked. |
| Histórico | 1px rows | status · date. |
| Race | `sonner` toast | Refresh. Do not re-POST blindly. |

---

### `/saas/estoque`

| Region | Primitive | Notes |
|---|---|---|
| Title / sub | — | Estoque · `saas_sub_estoque`. No primary CTA (empty may `Button variant="link"` Chat de estoque for supervisor). |
| Body | `Table` | SKU link 600, Nome, Em estoque, Reservado, Disponível (`tabular-nums`). |
| Visibility | `Switch` | **Supervisor only**, this table — **not** Configuração. `aria-label="Visível na loja, SKU {code}"`. |
| Mobile supervisor/vendedor | `overflow-x-auto` | Keep table. |
| Estoquista `<768` | stacked labeled qty | Never three unlabeled numbers. |
| Empty | — | `empty_skus`. |
| Vendedor | read | No `Switch`. |

---

### `/saas/estoque/[sku]`

| Region | Primitive | Notes |
|---|---|---|
| Crumb | `Breadcrumb` | Estoque / {sku}. |
| Title | — | `{nome}` + sku 12 muted. |
| CTA | `Button` | Ajustar if legal — or submit inside the ajuste section. |
| Quantidades | — | Three **labeled** tabular figures. `Separator` sections. |
| Visível | `Switch` | Supervisor only. |
| Ajuste | `Field` + `Input` + `Textarea` + `Button` | Delta or new on_hand + Motivo obrigatório. Supervisor / estoquista. |
| Movimentações | `Table` | |
| Vendedor | read-only | No switch, no ajuste. |

---

### `/saas/chat-estoque` (supervisor)

| Region | Primitive | Notes |
|---|---|---|
| Title / sub | — | Chat de estoque · `saas_sub_chat`. |
| Thread | `ScrollArea` | White column `border`. User bubble `bg-muted` (`#f7f7f7`). System `bg-card border`. **Not** iMessage tails. |
| Preview | `Table` + `Badge` | Row `criar` / `atualizar` / `erro`. Title “Prévia — nada foi aplicado”. |
| Confirm | `Button variant="default"` | **Confirmar aplicação** on the preview — the only apply path. Helper `confirm_hint`. All-bad: `disabled` + `confirm_disabled_all_bad`. |
| Discard | `Button variant="outline"` | Descartar → thread “Nada foi aplicado.” |
| Drop zone | `Button variant="outline"` dashed | `className="h-auto w-full border-dashed p-8"` triggers `Input type="file"`. Hover border `color-mix(primary 40%, #e8e8e8)`. |
| Composer | `Textarea` + `Button` | Instruction optional. **Sending text does not apply stock.** |
| Parse | in-thread text | “Lendo o arquivo…” — not a route. |
| Errors | in-thread `Alert` | Unreadable / missing headers. No preview. |
| Entitlement | disable Confirm | Preview still readable. |

---

### `/saas/tema` (supervisor)

| Region | Primitive | Notes |
|---|---|---|
| Title / actions | `Button` | Salvar tema `default` · Cancelar `outline`. |
| Fields | `Field` + `Input` | marca, primary `type="color"`, accent `type="color"`, background `type="color"`, logo URL + `Input type="file"` image. **No font / radius / dark fields.** |
| Preview | framed tenant mapping | Representative UI (see §2). Not swatches only. |
| Layout | — | ≥900px fields left, preview right. Mobile: preview under. |
| Contrast | `FieldError` | Save disabled. |
| Dirty leave | `AlertDialog` | `theme_dirty`. |
| Logo broken | — | Wordmark + `theme_logo_missing`. |

---

### `/saas/configuracao` (supervisor)

| Region | Primitive | Notes |
|---|---|---|
| Title / save | `Button variant="default"` | Salvar. |
| Documents | `Switch` + `Field` | `aceita_cpf`, `aceita_cnpj`. Last `true` is `disabled` + `last_flag`. |
| Canais | `RadioGroup` | `email` · `whatsapp` · `ambos`. |
| Vendedor padrão | `Select` or read-only `Field` | Seed `vendedor@demo.local`. |
| Forbidden here | — | No `visivel_loja`, no tema, no billing. |

---

### `/saas/avisos`

| Region | Primitive | Notes |
|---|---|---|
| Title / sub | — | Avisos · `saas_sub_avisos`. No CTA. |
| Body | `Table` | Data, Canal `Badge` (E-mail / WhatsApp), Destino masked, Modelo, Pedido `Button variant="link"`, Status `Badge`. |
| Empty | — | `empty_outbox`. |
| Reenviar | — | **None.** |

---

### Account shell (all `/conta/*` except login uses same header after auth)

`[data-theme="product"][data-density="comfortable"]`

| Region | Primitive | Notes |
|---|---|---|
| Header | `Button` | 56px `--primary` (`#1E3A5F`) bar. Wordmark IBM Plex 14/600 `saas_frota · Conta` in `--primary-foreground`. Nav: Assinatura current = 2px underline on-primary. Sair `Button variant="ghost" className="text-primary-foreground hover:bg-white/10"`. **No** pedidos / estoque / tema / loja / SaaS. |
| Stage | — | `--background` `#F4F6F8`. |

---

### `/conta/entrar`

| Region | Primitive | Notes |
|---|---|---|
| Card | `Card` | Cool stage, max 420px, Plex title, kicker `auth_kicker_account`. |
| Fields | `Field` + `Input` `h-11` | e-mail, senha. |
| Submit | `Button variant="default" className="h-11 w-full"` | |
| Forbidden | generic | `Você não tem acesso.` — not the Account shell, not “você é supervisora”. |

---

### `/conta`

| Region | Primitive | Notes |
|---|---|---|
| Card | `Card` | max 480px, pad 32. |
| Plan | — | Plex 600 display name (seed Plano Demo). |
| Status | `Badge` hero | `h-8 text-sm` — Ativa / Inadimplente / Cancelada. Focal point. |
| Actions | `Button className="h-11 w-full"` stacked | `ativa`: Marcar inadimplente `outline` · Cancelar `destructive`. `inadimplente`: Reativar `default` · Cancelar `destructive`. `cancelada`: Reativar `default`. |
| Confirm | `AlertDialog` | Copy includes lock/unlock effect. |
| After change | `Alert` | Writes allowed or blocked — **no** deep link to Loja/SaaS. |
| Error | `Alert` | `save_error`. Keep previous status. |
| Loading | `Skeleton` | One card. |
| Empty | — | N/A. |

---

## 7. States → primitives

| State | Primitive |
|---|---|
| Loading | `Skeleton` matching layout; chrome stays |
| Empty | Copy from `states.md` + optional tile + optional `Button` |
| Error load | `Alert` + `Button` Tentar de novo |
| Forbidden screen (SaaS) | Redirect role home |
| Forbidden Account | Generic denial, no shell leak |
| Entitlement | `Alert` + disabled writes |
| Parse-error | In-thread `Alert` / preview `Badge` erro; Confirm rules in `states.md` |
| Registry-down | `Alert` warning |
| Theme contrast | `FieldError` |
| Success notify | `Alert` `aria-live` |
| Race | `sonner` |

---

## 8. Responsive (kit implications)

| Element | Desktop | Mobile |
|---|---|---|
| Store header | one row | wrap; cart stays |
| Store grid | 4 | 2 (not 1) |
| Store cart | `Table` | stacked + sticky footer `Button` |
| Store footer | 3–4 cols | one column |
| SaaS nav | `Sidebar` 240 sticky | `Sidebar` → `Sheet`; 48–52 Menu bar |
| SaaS role + Sair | `SidebarFooter` | drawer foot |
| SaaS table | full | horizontal scroll (supervisor/vendedor) |
| Warehouse list | cards OK | **cards + 52px + bottom `Button`s** |
| Tema | two columns ≥900 | stack |
| Account | same card | stacked `h-11` |

Warehouse / courier `<768`: 16px body. Do not invent a second palette.

---

## 9. Handoff to frontend

### Must implement

1. Map tokens **per surface** (§2). `--font-sans` = Inter (tenant) / IBM Plex (product).
2. Rebuild every route in §6 with the named primitives only.
3. Three chromes side by side: **shop white / desk gray / billing navy**.
4. Flip Norte primary → buttons, prices, active 3px bar, photo-tile gradient follow; sidebar, shop page, Account stay put.
5. Legal transitions omitted. Confirm apply is a `Button` on the preview. `visivel_loja` is a `Switch` on Estoque. No billing in SaaS. No ops in Account.

### Must not improvise

- Hierarchy, chromes, or a fourth visual language.
- A CSS component kit (`.sf-*` primitives).
- Different shadcn primitives than this inventory (`Tabs` for CPF, `Sheet` for Store cart, `Card` for Desk lists, `DropdownMenu` for a user menu, `Pagination` instead of load more).
- Extra `npx shadcn add` without returning to Design.
- Geist / Fraunces / tenant-editable dark mode / tenant theme on Account.
- Hex for **tenant** colors in screens (system Desk/footer hexes are allowed as chrome).
- New routes, dashboards, pessoas, pagamento, Store→SaaS, “ir para a conta”.
- Status label synonyms. Apply-from-chat-text. Second stock column. Courier maps.
- Theme-editor fields beyond marca, primary, accent, background, logo.

### Install

```text
# none — use what is already in apps/web/src/components/ui/
```

### Flexible (frontend)

Code organization, how Tailwind overrides are applied, whether photo-tile / stepper / trail are local helpers (not a second published kit), RHF vs uncontrolled `Field`.

If a decision is missing or a primitive is incompatible, **return to Design**.

---

## 10. Self-critique

| Question | Verdict |
|---|---|
| Strong focal point per surface? | Shop tiles / Desk table / Account status Badge |
| Hierarchy in ~2s? | Yes — three chromes stay distinct |
| Distinctive vs generic shadcn app? | Yes if mapping + overrides are followed (white shop, gray desk, navy billing) |
| Parallel CSS kit avoided? | Yes — primitives + Tailwind chrome |
| Density? | Compact Desk / comfortable Store+Account / 52px warehouse |
| a11y? | Text+color status, hits, live regions, contrast gate |

Quality: usability / hierarchy / responsive / a11y target ≥ 8. Visual impact is intentional restraint on Desk; Store carries the shop personality.
