# Tokens

Machine-readable sources: [`tokens.json`](./tokens.json), [`tokens.css`](./tokens.css).

**Kit mapping:** [`shadcn.md`](./shadcn.md) §2 — tenant/product tokens map onto shadcn CSS variables **per surface**. Do not assign one global `--background` / `--accent` for all three chromes.

Store and SaaS share **tenant** tokens and differ only in density. Account uses **product** tokens and never reads the tenant theme.

## Who edits what

| Token | CSS variable | Seed demo | Editor? |
|---|---|---|---|
| marca | `--marca` | `Norte Atacado` | Tenant (supervisor) |
| primary | `--color-primary` | `#0F4F3E` | Tenant |
| accent | `--color-accent` | `#C2410C` | Tenant |
| background | `--color-background` | `#F6EFE3` | Tenant |
| logo | `--logo-url` | none (wordmark) | Tenant (URL or upload) |
| text | `--color-text` | `#1C1917` | System — not in editor |
| text muted | `--color-text-muted` | `#57534E` | System |
| danger | `--color-danger` | `#B42318` | System |
| success | `--color-success` | `#1B7A4A` | System |
| warning | `--color-warning` | `#B45309` | System |
| radius | `--radius-sm/md/lg/pill` | 4 / 8 / 12 / 999 | System |
| spacing | `--space-1` … `--space-7` | 4 / 8 / 12 / 16 / 24 / 32 / 48 | System |
| display font | `--font-display` | Inter (tenant); IBM Plex Sans (Account) | System — not in editor |
| body font | `--font-body` | Same as display | System |
| UI font | `--font-ui` | Inter, system-ui, sans-serif (tenant) | System |
| sans (compat) | `--font-sans` | Alias of `--font-ui` | System |
| card shadow | `--shadow-card` | Hairline `0 1px 2px rgba(0,0,0,.04)` | System |
| card hover | `--shadow-card-hover` | Light lift, no primary wash | System |
| float shadow | `--shadow-float` | Dialogs | System |
| motion | `--duration-fast` / `--duration` / `--ease-standard` | 160ms / 180ms / emphasized ease | System |

Do not invent extra editable slots (font family, radius, danger, dark mode) in the MVP theme editor. Visual type and shadows are locked in [`visual.md`](./visual.md). Kit composition is locked in [`shadcn.md`](./shadcn.md).

Derived (not editable, computed from the set above):

| Token | Rule |
|---|---|
| `--color-marca` | Same as primary unless a dedicated marca color is stored |
| `--color-text-on-primary` | Light cream/ink that passes 4.5:1 on primary |
| `--color-text-on-accent` | Light cream that passes 4.5:1 on accent |
| `--color-surface` | Background lightened toward white (seed `#FFFBF5`) |
| `--color-surface-raised` | `#FFFFFF` on light themes |
| `--color-border` | Background darkened (~8–12%) |

## Seed demo (must be visibly non-default)

The `demo` tenant is **Norte Atacado**: pine green, burnt terracotta, cream background. Those colors tint **actions, links, prices, the SaaS active bar, photo-tile gradients, and the optional Store utility bar**. They do **not** paint SaaS chrome or the shop page.

- Primary `#0F4F3E` (pine), not `#2563EB` — buttons, links, active 3px bar, Store prices.
- Accent `#C2410C` (terracotta), used for wholesale cues — not a second primary button on the same row.
- Background `#F6EFE3` (cream) — **utility top bar only** on Store. Shop page is white. SaaS canvas is system `#0c0c0e`.

Account (`[data-theme="product"]`) is cool ink (`#1E3A5F` on `#F4F6F8`). Side-by-side: white Woo shop / dark studio SaaS / navy billing. Three chromes.

## Density

| Surface | `data-density` | Body | Tables / lists |
|---|---|---|---|
| Store | `comfortable` | 16px | Cards, 16–24px gaps |
| SaaS | `compact` | 14px | Tables, 40px rows on desktop |
| Account | `comfortable` | 16px | One card, generous padding |
| SaaS warehouse / courier (viewport &lt; 768px) | `compact` + large hits | 16px body on device | Cards, 48–52px actions |

Same color tokens. Do not ship a second palette for “mobile”.

Type roles (see `visual.md`): Store and SaaS use **Inter** for chrome, titles, and prices. Account uses **IBM Plex Sans** only (`[data-theme="product"]` remaps `--font-*`). Do not load Fraunces or Source Serif 4.

## Live preview (theme editor)

1. Changing marca, primary, accent, background, or logo updates CSS variables **immediately** in a framed preview (store header + price chip + primary button + SaaS table snippet).
2. The rest of the SaaS shell around the editor does **not** hot-swap until **Salvar tema** succeeds. Accidental edits must not recolor the operator’s whole shift.
3. After save, Store and SaaS refetch tokens (or reload variables). Account is unchanged — assert this in QA.
4. Contrast gate before save: system `--color-text` on the chosen background, and `--color-text-on-primary` on primary, must be ≥ 4.5:1. Fail → inline error, no persist. MVP assumes **light** backgrounds; do not add a dark-theme mode.
5. Logo: image URL or upload. Empty logo → wordmark from `marca`. Broken image → wordmark + “Logo indisponível”.
6. Cancel / navigate away with dirty fields → discard confirm.

## shadcn variable mapping

Frontend maps the tokens above onto shadcn CSS variables. **Per surface** — see the full table in [`shadcn.md`](./shadcn.md) §2.

| Token | shadcn | Store | SaaS | Account |
|---|---|---|---|---|
| `--color-primary` | `--primary` | yes | yes | product `#1E3A5F` |
| `--color-text-on-primary` | `--primary-foreground` | yes | yes | `#F4F6F8` |
| `--color-text` | `--foreground` | yes | yes | `#142033` |
| `--color-text-muted` | `--muted-foreground` | yes | yes | `#5B6573` |
| `--color-danger` | `--destructive` | yes | yes | yes |
| `#fff` / raised | `--card` | shop white | list/form white | billing white |
| system hairline `#e8e8e8` | `--border` `--input` | Woo hairline | Desk hairline | product `#D5DCE3` |
| `--color-accent` | **`--ring`** and `--brand-accent` | terracotta focus + Atacado | same | product `#3D6B8C` |
| `--color-accent` | **not** `--accent` | shadcn `--accent` stays a muted hover wash | same | same |
| `--color-background` | **not** `--background` on Store/SaaS | utility bar only | unused on canvas | `--background` `#F4F6F8` |
| system canvas | `--background` | `#ffffff` | `#0c0c0e` | `#F4F6F8` |
| system sidebar | `--sidebar*` | unused | `#fafafa`, hover `#f0f0f0`, primary = 3px bar only | unused |
| `--radius-md` 8px | `--radius` | yes | tables override ≤4px | yes |
| `--font-ui` | `--font-sans` | Inter | Inter | IBM Plex Sans |

`--sidebar` is **never** `--color-primary`. `--color-border` cream is **never** the Woo/Desk hairline.

## Applying tokens in UI

- Store page: shadcn `--background` = system white. Tenant `--color-background` on the optional 36px utility bar only. SaaS `--background` = system `#0c0c0e`; `--card` `#141416`. Account: `--background` = product gray.
- Cards, dialogs, inputs: `--card` / `--popover` (white). SaaS lists: 1px `#e8e8e8` `Table` wrap, **no** `--shadow-card`, **no** `Card`.
- Primary buttons (`Button default`), links, Store prices, SaaS **active 3px bar + 8% wash**, Account header: `--primary`. **Not** the SaaS sidebar fill. Store header is white (see `visual.md`).
- Brand accent (`--brand-accent`): atacado `Badge`, MOQ hint, focus `--ring`. Never the only cue (also use text). Never assign it to shadcn `--accent`.
- Danger / success / warning: system tokens only. Status `cancelado` = `Badge destructive`; `entregue` = success tint; `separando` / `cnpj_registro_pendente` / entitlement = warning.
- Focus ring: shadcn `--ring` ← `--color-accent` (tenant) or product `#3D6B8C`. Never `outline: none` without a replacement.
- Store product tiles: hairline `--shadow-card` on `Card`; hover (fine pointer only) `--shadow-card-hover` + 1px lift. No primary-tinted kraft wash.
- Product media placeholders: square tile, gradient from `--primary` → mix with `--brand-accent`, Inter initials in `--primary-foreground`. No extra color tokens. No stripe crate.
- Buttons/inputs: `--duration-fast`. `prefers-reduced-motion: reduce` zeros movement.
- Do not add the `dark` class. Leave shadcn `.dark` unused.

## What frontend must not improvise

- Hex for tenant colors in screens. Use variables. Desk canvas / sidebar system hexes are listed in [`saas-desk.md`](./saas-desk.md); Store footer hexes in [`visual.md`](./visual.md) — do not add them to the theme editor.
- Tenant `--color-background` as shadcn `--background` on Store or SaaS.
- Tenant `--color-accent` as shadcn `--accent`.
- Tenant `--color-primary` as `--sidebar`.
- Tenant theme on Account.
- Account/product navy on Store or SaaS.
- Extra theme fields.
- Dark mode or per-role palettes.
- A parallel CSS token kit beside shadcn variables.
