# Account UX

Billing surface. Conceptual base `/conta`. **Product chrome**, not tenant theme. pt-BR.

**Kit:** [`shadcn.md`](./shadcn.md). Visual chrome: [`visual.md`](./visual.md). Do not invent `.sf-*` primitives. Never apply tenant tokens.

## Users and jobs

| User | Job |
|---|---|
| `account_owner` | See plan name + `subscription_status`; flip the manual flag |
| Seed `dono` | Same, then uses **/saas** separately for operations |
| Supervisor-only (e.g. `supervisora@demo.local`) | Denied — no Account chrome, no leak of plan UI |

`account_owner` does not grant supervisor powers. This surface does not grant SaaS.

## Flow

### Entry

`/conta/entrar` — email + senha. Success → `/conta`. User without `account_owner` → forbidden (generic “sem acesso”), stay out.

### Happy path

One card:

1. Product header: wordmark **saas_frota** + “Conta”. No tenant `marca`, no pine/cream.
2. **Plano:** tenant plan display name (seed “Plano Demo”).
3. **Status:** `ativa` | `inadimplente` | `cancelada` as the hero badge.
4. Manual actions (only those that change state):

| Current | Actions |
|---|---|
| `ativa` | **Marcar inadimplente** · **Cancelar assinatura** |
| `inadimplente` | **Reativar** · **Cancelar assinatura** |
| `cancelada` | **Reativar** |

5. Confirm dialog states the operational effect: Store checkout and SaaS writes will lock or unlock. Then persist.
6. Sair.

No payment method, invoice list, seats, or PIX.

### After a flag change

Status hero updates. Helper text: writes on Loja/SaaS now allowed or blocked. Still **no** deep link to those surfaces.

## Layout (desktop / mobile)

Centered column, max 480px. Calm: product navy on cool gray (`tokens.md` product set). One `Card`, pad 32px (`--space-5` / `--space-6`), no ops table density.

Mobile: same `Card`, actions stacked `Button className="h-11 w-full"`.

Header: 56px `--primary` (`#1E3A5F`) bar. Wordmark IBM Plex 14/600 `saas_frota · Conta` in `--primary-foreground`. Nav: **Assinatura** `Button ghost` (current = 2px underline on-primary) + Sair `Button ghost` inverse. Zero pedidos / estoque / tema / loja / SaaS.

## Components

### shadcn inventory (mandatory)

| Component | Screen / region | Notes |
|---|---|---|
| `Button` `ghost` | Header Assinatura, Sair | Inverse on navy (`text-primary-foreground`) |
| `Button` `default` `h-11 w-full` | Reativar | |
| `Button` `outline` `h-11 w-full` | Marcar inadimplente | |
| `Button` `destructive` `h-11 w-full` | Cancelar assinatura | Confirm in `AlertDialog` |
| `Card` | `/conta` billing, `/conta/entrar` | max 480 / 420, `rounded-lg`, `--shadow-card` |
| `Badge` | Status hero | `h-8 text-sm`. `ativa` success tint · `inadimplente` warning · `cancelada` `destructive` |
| `Field` + `Input` `h-11` | Login e-mail / senha | |
| `AlertDialog` | Reativar / inadimplente / cancelar | Copy includes lock/unlock effect |
| `Alert` | Save error; post-change helper | No Loja/SaaS href |
| `Skeleton` | Card loading | Header stays |

**Do not use:** `Sidebar`, `Sheet`, `Table`, `NavigationMenu`, `DropdownMenu`, `Tabs`, `Switch` (no plan toggle — explicit buttons + confirm).

### Composition

```
navy header (Button nav) 
  → stage #F4F6F8
    → Card
        plan name (Plex 600)
        Badge status (focal)
        stacked Buttons
```

Login: same geometry as Store My Account **card**, cool sibling — Plex + navy stage, kicker `auth_kicker_account`. Not Desk login.

## States

| State | Behavior |
|---|---|
| Loading | Card skeleton. |
| Error save | “Não foi possível atualizar o plano.” Keep previous status. |
| Forbidden | Not the Account shell. Same generic denial as unknown users — do not say “você é supervisora”. |
| Confirm cancel | Warning dialog, explicit. |
| Confirm inadimplente | Warning dialog, explicit. |
| Confirm reativar | Neutral dialog. |
| Empty | N/A — tenant always has a plan name + status. |

## Tokens used

`[data-theme="product"]` + `[data-density="comfortable"]`. Map onto shadcn per [`shadcn.md`](./shadcn.md): `--primary` `#1E3A5F`, `--background` `#F4F6F8`, `--ring` `#3D6B8C`. IBM Plex on `--font-sans`.

| Token | Product value |
|---|---|
| primary / marca | `#1E3A5F` |
| accent | `#3D6B8C` |
| background | `#F4F6F8` |
| text | `#142033` |

**Do not** read tenant CSS variables on this surface. QA: change Norte Atacado primary in SaaS; this page stays ink/gray.

Status tones use **system** danger / success / warning (shared, not tenant-editable):

- `ativa` → success
- `inadimplente` → warning
- `cancelada` → danger (outline)

## Copy (pt-BR)

See `copy-pt-BR.md` (account section). Actions: **Reativar**, **Marcar inadimplente**, **Cancelar assinatura**.

## Handoff to frontend

### Must implement

- Product navy header + one billing `Card` + status `Badge` hero + stacked `h-11` actions + `AlertDialog` confirms.
- Login `Card` on cool gray, Plex, `auth_kicker_account`.

### Must not improvise

- Do not apply tenant theme.
- Do not add operational nav or “abrir SaaS / loja”.
- Do not add a payment provider UI.
- Supervisor-only users never see this IA.
- `dono` uses this chrome for billing and `/saas` chrome for ops — two headers, two themes.
- Do not invent `.sf-*` billing primitives or a `Sidebar` on Account.

### Existing components to reuse

`button`, `card`, `badge`, `field`, `input`, `alert-dialog`, `alert`, `skeleton`.

### Install

None.
