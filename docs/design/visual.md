# Visual language UX

Visual source of truth for **existing MVP screens only**. No new routes, modules, dashboards, theme-editor fields, SKU photo upload, or billing in SaaS. SaaS has a user color-mode preference (Claro / Escuro / Automático); that is not a tenant theme field.

**UI kit source of truth:** [`shadcn.md`](./shadcn.md). Store, SaaS, and Account share shadcn/ui (Radix Nova). They do **not** share layout. Do not invent a parallel `.sf-*` CSS kit.

Tokens stay: tenant edits marca, primary, accent, background, logo. System owns type, radius, spacing, danger/success/warning, elevation, and motion — [`tokens.md`](./tokens.md). Tenant tokens map onto shadcn CSS variables **per surface** (see `shadcn.md`).

Copy: [`copy-pt-BR.md`](./copy-pt-BR.md). Do not rename status labels.

## North star

Two familiar products, one tenant.

- **SaaS** looks like a **shadcn/studio admin** (AdminCN craft): grouped sidebar, KPI cards from real counts, tables in rounded cards. **Light by default**, with Claro / Escuro / Automático. Tenant `--color-primary` tints **buttons and KPIs only** — never a painted sidebar.
- **Store** looks like a **WordPress WooCommerce Storefront** shop: white page, utility bar + cart header, product photo tiles, shop toolbar, dark footer. Classic shop, not an editorial kraft catalog.
- **Account** is unchanged product navy. Not tenant theme. Not the SaaS studio chrome.

Norte Atacado’s pine / terracotta / cream remain the **seed tenant colors**. They tint buttons, prices, KPI numbers, and an optional 36px Store utility strip. They do **not** fill the SaaS sidebar, the shop page, or Account.

No Fraunces. No Source Serif 4. No kraft paper stage. No cream masthead. No tenant-editable dark mode (SaaS color mode is a user preference: Claro / Escuro / Automático, default Claro).

## Users and jobs

| Who | Visual job |
|---|---|
| Guest / cliente | Recognize a shop in one glance: photo tile, title, price, **Adicionar**, cart count. Register on a plain My Account card. |
| Cliente CNPJ | See **Atacado** + MOQ on the same Woo card anatomy as varejo. |
| Supervisor / vendedor | Scan KPI counts, then a dense table; open a form, press a button row. |
| Estoquista / entregador | Large hits on mobile; dark cards with 52px primary. |
| `account_owner` | Calm billing card. Must not look like the shop or the desk. |

## Type

System-level only — **not** in the theme editor. Load with `next/font/google` (preferred) or the Google Fonts CSS URL. Subset **latin + latin-ext** (ã, ç, õ).

| Role | Face | Use |
|---|---|---|
| **UI / display / body (Store + SaaS)** | [Inter](https://fonts.google.com/specimen/Inter) 400, 500, 600, 700 | All Store chrome, titles, prices, PDP, auth. **All of SaaS** (sidebar, lists, forms, warehouse cards). |
| **Account** | [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) 400, 500, 600, 700 | All Account chrome and the billing card. Override on `[data-theme="product"]`. |

`--font-display`, `--font-body`, and `--font-ui` all resolve to **Inter** on tenant surfaces. `--font-sans` aliases `--font-ui`. Account remaps the three families to IBM Plex Sans.

**Do not** load or apply Fraunces or Source Serif 4. Do not use a display serif on Store titles, wordmarks, or empty states. Do not use Fraunces on the SaaS sidebar wordmark.

### Import

```
https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap
```

`next/font`: `Inter`, `IBM_Plex_Sans`. Map Inter → `--font-ui` / `--font-display` / `--font-body`. On `[data-theme="product"]`, map IBM Plex → the same three variables.

### Fallbacks

- Store + SaaS: `Inter, ui-sans-serif, system-ui, sans-serif`
- Account: `"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif`

### Sizes and weights

| Token / role | Store (comfortable) | SaaS (compact) | Account |
|---|---|---|---|
| Page / list title | 24px / 600 (shop page name, if shown) | **24px / 600 tracking-tight** | 28px Plex 600 |
| Product title (card) | **16px / 600** under the tile | — | — |
| PDP title | 24–28px / 600 | — | — |
| Price | 16–18px / 600 tabular, `--color-primary` | 16px / 600 tabular | — |
| Price (PDP) | 24px / 600 tabular, `--color-primary` | — | — |
| Body | 16px | 14px | 16px |
| Small / meta / SKU | 13–14px / 400 muted | 12px / 400 muted | 14px |
| Button / chip | 14px / 600 | 13px / 600 | 14px / 600 |
| Sidebar nav | — | 13px / 500, 16px icon | — |
| Shop toolbar | 14px / 400 muted | — | — |

Line-height: title 1.25, body 1.5, UI 1.35. Wordmark: Inter 600, 18–20px Store header / 16px SaaS sidebar. No optical-size serif.

## Elevation / motion

Desk lists and Woo product tiles are **border-first**, not kraft dual-shadow cards.

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.06)` | Inputs at rest |
| `--shadow-card` | `0 1px 2px rgba(0,0,0,.04)` | Woo product tile (optional), auth card, Account card. **Not** SaaS list wraps. |
| `--shadow-card-hover` | `0 2px 8px rgba(0,0,0,.08)` | Store product hover only (`pointer: fine`). No primary-tinted wash. |
| `--shadow-float` | `0 8px 24px rgba(0,0,0,.12)` | Dialogs |
| `--duration-fast` | `160ms` | Hover, focus, button |
| `--duration` | `180ms` | Cards, sidebar active |
| `--ease-standard` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | All of the above |

**SaaS lists/forms:** 1px `#e8e8e8` (or `--color-border` if it is already that light). **No** `--shadow-card` on the Desk `Table` wrap (`div` + `border`, not `Card`).

**Hover (pointer: fine):** Woo product tile may lift 1px + `--shadow-card-hover`. Primary button: `color-mix(in srgb, var(--color-primary) 88%, #000)`. Secondary/outline: border → primary.

**Active:** button `translateY(1px)`, no shadow.

**Focus:** 2px `--color-accent` ring + 2px offset. Inputs also get `box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 28%, transparent)` and border-color primary. Never `outline: none` without the ring.

**`prefers-reduced-motion: reduce`:** duration 0; no translateY; keep color/border changes.

## System chrome (not tenant tokens)

Hardcode these as **system** CSS — do not add theme-editor fields.

| Token (document only) | Hex | Where |
|---|---|---|
| Desk canvas | `#0c0c0e` | SaaS app chrome around zinc cards |
| Sidebar | `#09090b` | SaaS left nav |
| Sidebar / studio hairline | `#18181b` / `#27272a` | Sidebar right border, table grid |
| Nav hover | `#18181b` | SaaS nav row hover / active |
| List thead | `#1c1c1f` | SaaS tables |
| Shop page | `#ffffff` | Store main, header, cards |
| Storefront footer | `#2c2d33` | Store footer background; footer text `#ffffff` / `#f0f0f1` |

Tenant `--color-background` may tint **only** the optional 36px Store utility top bar. Do not paint the shop page or the SaaS canvas with cream.

---

## SaaS — shadcn/studio admin

SaaS visual source of truth: **[`saas-desk.md`](./saas-desk.md)**. Implement the operator workspace from that spec. Do not restyle SaaS from leftover Store/Account chrome.

Locked one-liners (detail lives in `saas-desk.md`):

- Inter on all SaaS. No Fraunces.
- Grouped **Operação** / **Casa**. Light sidebar `#ffffff` / dark `#09090b`. **Never** fill the rail with tenant primary.
- Light canvas `#f4f4f5` / dark `#0c0c0e`. Rounded studio cards, radius 12px.
- `--color-primary` tints buttons, links, KPI numbers. Mix toward white only in dark.
- Sticky inset header: trigger, breadcrumb, **Aparência**, role, Sair.
- List: title 24 left, CTA right, KPI row from real counts, filter, table in rounded card.
- Form: breadcrumb, title + **small** status tag, button row.
- Login: studio card + Aparência control. “Acesso da equipe”.
- Warehouse/courier: cards, 52px primary.
- Color mode is a user preference, not a theme-editor field.
- No fake analytics, no week-over-week, no new dashboard route.

---

## Store — WooCommerce Storefront

`[data-theme="tenant"]` + `[data-density="comfortable"]`. Classic Woo shop. Page is **mostly white (`#fff`)**. Tenant `--color-background` may tint a **thin top bar only**, not the whole shop.

### Utility top bar (optional, 36px)

- Background: `--color-background` (seed cream) or a 12% mix toward primary.
- Left: `marca` in Inter 12–13px / 600. **Phone-less** — no invented phone number.
- No nav here.

### Header

White. 64px desktop / 56px mobile. Sticky. **1px bottom border `#e8e8e8`**. Not a cream masthead. Not a primary bar.

```
[ logo / marca ]   Catálogo          [ Carrinho  N ]  Cadastrar  Entrar
```

- Logo / wordmark **left**: 32px logo or Inter 600 wordmark in `--color-text` or `--color-primary`. **Simple sans, not Fraunces.**
- Nav: Inter 14/500, `--color-text`, gap 20px. **Catálogo** (and Meus pedidos when logged in). Hover: primary. Current: 600 + 2px primary underline offset 4px (Store only).
- **Carrinho right, Woo-style:** cart icon + label `nav_carrinho` (“Carrinho”) + count. Count uses `cart_itens` / `cart_item_one` (“N itens” / “1 item”) as visible text or `aria-label`. Do not hide the cart.
- **Cadastrar / Entrar** as text or a small button (Cadastrar may be small primary; Entrar text). Logged-in: Meus pedidos text, Sair text.
- No SaaS / Account links.
- Hits ≥ 44px on small viewports.

Mobile: brand left; Carrinho + auth right; Catálogo / Meus pedidos may wrap to a second row. Do not hide cart.

### Shop loop

Kill the kraft catalog hero (kicker + giant serif “Catálogo”). This is a Woo shop toolbar + grid.

```
Mostrando N produtos
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ ■  │ │ ■  │ │ ■  │ │ ■  │
│ t  │ │ t  │ │ t  │ │ t  │
│ R$ │ │ R$ │ │ R$ │ │ R$ │
│Add │ │Add │ │Add │ │Add │
└────┘ └────┘ └────┘ └────┘
```

- Toolbar **left:** `shop_showing` / `shop_showing_one` (“Mostrando {n} produtos”). 14px muted.
- Channel context (guest / CPF / CNPJ) may stay as a 13px line under the toolbar using existing `catalog_lede_*` — not a Fraunces lede.
- Main: max-width **1200px**, padding 24px (mobile 16px).
- Grid: **2 / 3 / 4** (mobile 2, tablet 3, desktop 4). Gap 16–20px.

### Product card (Woo loop)

Left-aligned like Storefront default. Not a giant serif kraft card.

```
┌──────────────────┐
│                  │
│  PHOTO TILE      │  1:1 square
│  (gradient+init) │
│                  │
├──────────────────┤
│ Nome do produto  │  16px Inter 600, 2-line clamp
│ R$ 12,00         │  --color-primary, 16–18px tabular
│ [Varejo] 14 un   │  chip + stock meta
│ [ Adicionar ]    │  Woo add-to-cart: outline or solid primary
└──────────────────┘
```

- Card: white, 1px `#e8e8e8` or hairline `--shadow-card`. Radius-md. Padding 0 (media flush) then 12px content. Title links to PDP; CTA still adds to cart.
- **Adicionar:** outline (1px primary) **or** solid primary — pick one and use it on every card. Full-width or left-aligned, min 40px (44px on mobile).
- **Sem estoque:** tile 70% opacity; `sem_estoque`; CTA disabled with the reason on the button.
- Atacado: price + chip **Atacado** + `Qtd. mín. N un` on one meta row. Accent is never the only cue.
- Added confirmation: 13px success under the button (`aria-live`), not a toast.

#### Designed placeholders (no SKU images in the API)

Woo has photos; we **fake a product photo tile**. Do **not** leave an empty rectangle. Do **not** add image assets or a media upload field.

1. **Square (1:1)** on the loop. Background: `linear-gradient(152deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-accent) 52%, var(--color-primary)) 100%)`.
2. Soft overlay only — **no** kraft 135° stripe crate. Optional 8% white radial top-left so it reads as a photo tile, not a paint chip.
3. Initials: first letter of the first two words of `nome` (skip DE, DA, DO, DOS, DAS, E). One-word SKU → first two letters. **Inter 600**, `--color-text-on-primary`, ~28% of media height.
4. `aria-hidden="true"` on the media. Accessible name remains the product title.
5. Contrast: initials must pass 4.5:1 (existing theme contrast gate).

Cart lines: **48×48** crop of the same tile (radius-sm). PDP: square or 1:1 block in the media column, initials ~32%.

### PDP (Woo split)

Desktop: media **left ~48%**, summary **right**. Breadcrumb `Início / Catálogo / Nome` (`breadcrumb_inicio` / `nav_catalogo` / product name).

```
Início / Catálogo / Nome
┌─────────────┐  Nome
│             │  R$ 12,00
│    media    │  [Varejo]  Disponível 14
│    ~48%     │  [ qty ]  [ Adicionar ]
└─────────────┘
```

- Title: Inter 24–28px / 600 (not giant serif).
- Price: Inter 24px / 600 tabular in `--color-primary` + channel chip on the same row.
- Qty stepper 44×44. Input 44px. Adicionar primary, 44px.
- Mobile: stack media then summary, 16px page pad. Same breadcrumb.
- No invented description, related products, or shipping.

### Cart

- Title **Carrinho** (Inter 24/600) + toolbar-style count (`cart_itens`) optional.
- Desktop: white lines, 1px dividers (not a kraft raised stack). Each line: 48px tile · name · unit + chip · stepper · subtotal · remove.
- Mobile: stacked; stepper and remove full-width hits 44px.
- Footer sticky on mobile: total (Inter 20/600 tabular) + primary **Finalizar pedido** / **Entrar para pedir**.
- Empty: existing copy + Ver catálogo. Simple Woo empty — no serif stage.

### Footer (Storefront)

3–4 columns on `#2c2d33`. Padding 40px 24px. Text `#f0f0f1`, links `#ffffff`, hover slightly brighter.

| Col | Heading | Links |
|---|---|---|
| 1 | `marca` (no heading key) | — |
| 2 | `footer_col_loja` (“Loja”) | Catálogo · Carrinho |
| 3 | `footer_col_conta` (“Minha conta”) | Entrar · Cadastrar (or Meus pedidos + Sair when logged in) |
| 4 | optional empty / repeat marca | — |

**No SaaS or Account links.** Do not invent phone, address, or social icons.

### Auth (Woo My Account)

White card, simple. Not a serif kraft stage.

- Page `#fff` or a light `#f5f5f5` shop canvas. Centered card max 420px, 1px `#e8e8e8` or `--shadow-card`, padding 32px.
- Heading: `auth_my_account` (“Minha conta”) or Entrar / Cadastrar — Inter 22/600.
- Optional kicker `auth_kicker_store` (“Acesso do cliente”) in 13px muted.
- Inputs 44px, labels Inter 600. Segmented CPF | CNPJ is the existing pill; active fill primary.
- Primary submit full width 44px. Secondary text link to the other auth screen.
- No Fraunces wordmark above the card. Logo/marca Inter if shown.

### Meus pedidos

- List: white rows, 1px dividers — number (Inter 600), date muted, **status badge**, total tabular.
- Detail: breadcrumb `Início / Meus pedidos / {id}`. Status as a **small tag** (same language as SaaS form, comfortable density). Trail + history. Customer document masked. No operator notify controls.

### Store mobile checklist

- Header 56px, **white**, 44px hits. Optional 36px utility bar.
- Catalog **2** columns; square tiles.
- Cart footer sticky.
- Auth card 16px page inset.
- Footer stacks to one column.

---

## Account

`[data-theme="product"]` + `[data-density="comfortable"]`. **Never** tenant variables. QA: change Norte primary → this page stays ink/gray.

**Unchanged product navy.** Still not tenant theme. Still not the SaaS studio chrome.

- Header: product navy, 56px, IBM Plex 14/600 wordmark `saas_frota · Conta`. Nav: Assinatura (current = 2px underline in `--color-text-on-primary`) + Sair ghost. No pine, no Inter shop chrome, no terracotta, no loja/SaaS links.
- Stage: `--color-background` `#F4F6F8`. Card max 480px, padding 32px, `--shadow-card`.
- Status remains the hero badge (`ativa` success, `inadimplente` warning, `cancelada` danger outline). Plan name Plex 600.
- Actions stacked 44px. Confirm dialogs unchanged.
- Login: cool stage, Plex title, kicker `auth_kicker_account`. Same 420px card geometry — Account is the cool sibling, not My Account (Store) and not Desk login.

---

## Component upgrades

**Kit:** shadcn primitives in `apps/web/src/components/ui/`. Full inventory and nesting: [`shadcn.md`](./shadcn.md). Apply the three chromes via token mapping; Account inherits **product** colors, not tenant.

### Buttons (`Button`)

| State | `variant="default"` | `variant="outline"` | Danger outline |
|---|---|---|---|
| Rest | `--primary` fill | white + 1px `#e8e8e8` | `outline` + `border-destructive text-destructive` |
| Hover | `hover:bg-primary/80` | border → primary | `hover:bg-destructive/10` |
| Active | primitive `translate-y-px` | same | same |
| Disabled | opacity 0.5 + nearby reason text | same | same |
| Focus | `--ring` = `--brand-accent` | same | same |

SaaS desktop: `size="default"` (h-8). Store / Account primaries: `className="h-11"`. Warehouse: `className="h-[52px] w-full"`. Woo **Adicionar** on cards = `outline` + primary border; PDP = `default`. Do not fork a `.sf-btn`.

### Inputs (`Field` + `Input`)

- Rest: white, 1px `#e8e8e8` (`--input`).
- Focus: primitive ring on `--ring` (tenant accent).
- Error: `aria-invalid` + `FieldError` (destructive text). No `.sf-field-error`.
- Labels always visible (`FieldLabel`) — not placeholder-only.
- Store / Account fields `h-11`; SaaS compact default `h-8`.

### Chips (`Badge`)

**Varejo** `outline` + primary. **Atacado** fill `--brand-accent` + `--brand-accent-foreground`. MOQ is text beside the chip. Role chip = same accent `Badge`. Status tones: [`shadcn.md`](./shadcn.md). Never rename status labels.

### Empty states

Keep titles/actions from [`states.md`](./states.md). Optional CSS-only tile — not a new primitive:

- Store: Woo empty (muted 16px title + `Button variant="link"` Ver catálogo). Optional 72×72 photo-tile (Inter initials from `marca`).
- SaaS: muted title, `Button` Novo pedido if legal. 56×56 zinc tile + 1px border.

No marketing module, no raster illustrations.

### Other

- Loading: `Skeleton`. Catalog skeletons **must** include a 1:1 media block.
- Confirms: `AlertDialog` (not `Dialog`). Toasts: `sonner` for races only.
- Skip link unchanged.

## Tokens used

System variables (see `tokens.md` / `tokens.css` / `tokens.json`): `--font-display`, `--font-body`, `--font-ui` (**Inter** on tenant; **IBM Plex Sans** on product), `--shadow-card`, `--shadow-card-hover`, `--shadow-float`, `--duration-fast`, `--duration`, `--ease-standard`.

shadcn mapping (per surface): [`shadcn.md`](./shadcn.md) §2 and [`tokens.md`](./tokens.md). `--font-sans` aliases `--font-ui`. Tenant `--color-accent` → `--ring` / `--brand-accent`, **not** shadcn `--accent`.

No new tenant-editable tokens. SaaS color mode (Claro / Escuro / Automático) is a user preference, not a theme field. Placeholders derive from `--color-primary` / `--color-accent` / `--color-text-on-primary`. Desk/footer hexes are system chrome, not theme fields.

## Copy (pt-BR)

New shop / footer strings only. Status words stay Novo / Confirmado / Separando / Despachado / Entregue / Cancelado.

| Key | String |
|---|---|
| `shop_showing` | Mostrando {n} produtos |
| `shop_showing_one` | Mostrando 1 produto |
| `cart_itens` | {n} itens |
| `cart_item_one` | 1 item |
| `breadcrumb_inicio` | Início |
| `footer_col_loja` | Loja |
| `footer_col_conta` | Minha conta |
| `auth_my_account` | Minha conta |

Existing `nav_carrinho` (“Carrinho”), `add` (“Adicionar”), `nav_catalogo`, `entrar`, `cadastrar` stay. SaaS `saas_sub_*` kickers stay as optional muted context under Desk titles.

## Accessibility

- Contrast ≥ 4.5:1 on body, chips, initials-on-placeholder, footer links on `#2c2d33`, inverse Account nav.
- Status and channel = text + color.
- Focus ring always visible. Warehouse/courier primaries ≥ 48×52, 12px gap. Store cart hit ≥ 44px.
- Placeholder and empty art: `aria-hidden`. Product name / empty title remain the name. Cart control name includes `Carrinho` + count (`N itens`).
- `prefers-reduced-motion` respected.
- Tax IDs stay masked. Do not put full CPF/CNPJ in `alt` or `title`.

## What frontend must not skip

1. **shadcn kit** — compose every screen from [`shadcn.md`](./shadcn.md). No parallel CSS primitives.
2. **Inter loaded** (latin-ext) for Store + SaaS; **IBM Plex** for Account only. `--font-sans` aliases `--font-ui`. No Fraunces / Source Serif 4 / Geist as product face.
3. **SaaS Desk** — follow [`saas-desk.md`](./saas-desk.md). Light `Sidebar`, gray canvas, 3px primary bar + 8% wash, role + Sair at `SidebarFooter`, Desk list/form, white login `Card`. Do **not** fill the sidebar with `--color-primary`.
4. **Role + Sair pinned at `SidebarFooter`** on desktop. No billing. No desktop SaaS top bar.
5. **SaaS canvas `#0c0c0e`**, zinc list/form cards. KPI row from real counts, then `Table` wrap. List = title left, CTA right, filter `Select`, **no fake charts**.
6. **Pedido detail** = `Breadcrumb` `Pedidos / {id}`, status as a **small `Badge`**, button row — see `saas-desk.md`.
7. **Store page is white.** Tenant background tints the **36px utility bar only**.
8. **Store header is Woo:** white, sans wordmark, Catálogo `Button ghost`, **Carrinho + `Badge` N itens**, Cadastrar/Entrar, 1px `#e8e8e8`.
9. **Shop loop:** toolbar “Mostrando N produtos”, grid 2/3/4, **square** photo tiles, 16px sans title, primary price, `Button outline` Adicionar.
10. **PDP** is Woo split (media ~48% / summary) + `Breadcrumb` `Início / Catálogo / Nome`.
11. **Store footer** 3–4 columns on `#2c2d33` — marca, Loja, Minha conta. No SaaS/Account links.
12. **Auth Store** is Woo My Account (`Card`). SaaS login is Desk-on-gray `Card`. Account login stays product navy.
13. **Account stays `data-theme="product"`** — Plex, navy, gray. Not studio SaaS. Not Woo.
14. **Warehouse/courier** large hits; `Card` = white + 1px border.
15. **No new routes, no billing in SaaS, no ops in Account, no Store→SaaS links, no theme-editor font/dark fields, no SKU image upload.** SaaS Aparência is a user preference.

## Handoff to frontend

**Rebuild on shadcn** — do not restyle the old `.sf-*` kit. Implementation inventory: [`shadcn.md`](./shadcn.md).

1. Map tenant / product tokens onto shadcn variables **per surface** (`shadcn.md` §2). Load **Inter** (tenant) and **IBM Plex Sans** (Account). `--font-sans` aliases `--font-ui`. Drop Fraunces, Source Serif 4, Geist as the product face.
2. **SaaS shell first** — `Sidebar` + `SidebarInset` per [`saas-desk.md`](./saas-desk.md) and `shadcn.md`. Do not restyle Store or Account in the same pass.
3. **Store chrome second:** utility bar, Woo header (`Button` + cart `Badge`), shop toolbar + 2/3/4 `Card` grid, square tiles, Woo PDP + `Breadcrumb`, dark footer, My Account `Card`.
4. **Account third:** product navy header + billing `Card` + `AlertDialog`. Never tenant variables.
5. Verify side-by-side: **shop white / desk gray / billing navy**. Flip a theme color — buttons, prices, active bar, and photo-tile gradient follow; sidebar and shop page stay light.
6. QA mobile warehouse/courier 52px hits, 2-col shop, cart hit, `prefers-reduced-motion`.

### What frontend must not improvise

- Hex for **tenant** colors in screens. Desk/footer system hexes above are allowed as chrome, not as theme-editor fields.
- A parallel CSS component kit (`.sf-btn`, `.sf-table`, …).
- Different primitives than `shadcn.md` names (`Sheet` for Store cart, `Card` wrapping Desk lists, `Tabs` for CPF/CNPJ).
- Fraunces, Source Serif 4, Geist, kraft dual-shadow cards, cream masthead, pine-filled sidebar.
- Inter on Account (keep Plex). Plex as the intended Store/SaaS face (Inter is).
- Stock photos, Unsplash, or a fake image URL on SKUs.
- A second theme token for fonts or shadows in the editor.
- Dashboard, pessoas, pagamento, or “ir para a conta”.
- Renamed status labels.
- Dark mode. Extra `npx shadcn add` without returning to Design.
