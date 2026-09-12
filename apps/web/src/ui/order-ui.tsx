"use client";

import type { OrderStatus, SaasRole } from "@saas-frota/shared";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { COPY } from "./copy";
import { formatMoney } from "./format";
import type { CanalAviso } from "./api";

const TRAIL: OrderStatus[] = ["novo", "confirmado", "separando", "despachado", "entregue"];

export const ROLE_TRANSITIONS: Record<SaasRole, Partial<Record<OrderStatus, OrderStatus[]>>> = {
  supervisor: {
    novo: ["confirmado", "cancelado"],
    confirmado: ["separando", "cancelado"],
    separando: ["despachado", "cancelado"],
    despachado: ["entregue"],
  },
  vendedor: {
    novo: ["confirmado", "cancelado"],
    confirmado: ["cancelado"],
  },
  estoquista: {
    confirmado: ["separando"],
    separando: ["despachado"],
  },
  entregador: {
    despachado: ["entregue"],
  },
};

export function legalTargets(role: SaasRole | null | undefined, status: OrderStatus): OrderStatus[] {
  if (!role) return [];
  return ROLE_TRANSITIONS[role][status] ?? [];
}

export function transitionLabel(to: OrderStatus) {
  if (to === "confirmado") return COPY.saas.to_confirmado;
  if (to === "cancelado") return COPY.saas.to_cancelado;
  if (to === "separando") return COPY.saas.to_separando;
  if (to === "despachado") return COPY.saas.to_despachado;
  if (to === "entregue") return COPY.saas.to_entregue;
  return COPY.status[to];
}

export function notifyCopy(canais: CanalAviso | undefined) {
  const channel = canais ?? "ambos";
  return {
    customer: COPY.notify[channel],
    seller: COPY.notify.seller,
  };
}

function statusClass(status: string) {
  if (status === "separando") return "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-transparent";
  if (status === "despachado") return "border-transparent bg-[var(--brand-accent)] text-[var(--brand-accent-foreground)]";
  if (status === "entregue") return "bg-[var(--color-success)]/15 text-[var(--color-success)] border-transparent";
  return undefined;
}

function statusVariant(status: string): "outline" | "default" | "secondary" | "destructive" {
  if (status === "novo") return "outline";
  if (status === "confirmado") return "default";
  if (status === "cancelado") return "destructive";
  return "secondary";
}

export function StatusBadge({ status, large }: { status: OrderStatus | string; large?: boolean }) {
  const label = COPY.status[status as OrderStatus] ?? status;
  return (
    <Badge
      variant={statusVariant(status)}
      className={cn(statusClass(status), large && "h-8 px-3 text-sm")}
    >
      {label}
    </Badge>
  );
}

export function PlanBadge({ status }: { status: "ativa" | "inadimplente" | "cancelada" }) {
  const label =
    status === "ativa"
      ? COPY.account.status_ativa
      : status === "inadimplente"
        ? COPY.account.status_inadimplente
        : COPY.account.status_cancelada;
  const variant = status === "cancelada" ? "destructive" : "secondary";
  const extra =
    status === "ativa"
      ? "bg-[var(--color-success)]/15 text-[var(--color-success)] border-transparent"
      : status === "inadimplente"
        ? "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-transparent"
        : undefined;
  return (
    <Badge variant={variant} className={cn("h-8 px-3 text-sm", extra)}>
      {label}
    </Badge>
  );
}

export function OutboxBadge({ status }: { status: string }) {
  if (status === "enviado") {
    return (
      <Badge variant="secondary" className="bg-[var(--color-success)]/15 text-[var(--color-success)] border-transparent">
        {COPY.outbox.enviado}
      </Badge>
    );
  }
  if (status === "falha") {
    return <Badge variant="destructive">{COPY.outbox.falha}</Badge>;
  }
  return <Badge variant="outline">{COPY.outbox.pendente}</Badge>;
}

export function StatusTrail({ status }: { status: OrderStatus }) {
  const current = TRAIL.indexOf(status);
  const cancelled = status === "cancelado";
  return (
    <div className="space-y-3">
      {cancelled ? (
        <Alert variant="destructive">
          <AlertDescription>{COPY.status.cancelado}</AlertDescription>
        </Alert>
      ) : null}
      <ol className="flex max-w-[280px] items-start" aria-label={COPY.trail}>
        {TRAIL.map((step, i) => {
          const done = !cancelled && i < current;
          const here = !cancelled && i === current;
          const stop = cancelled && i === TRAIL.length - 1;
          const filled = done || here || stop;
          return (
            <li
              key={step}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center text-[11px] text-muted-foreground",
                here && "font-semibold text-primary",
                done && "text-foreground",
                stop && "text-destructive",
                cancelled && !done && !stop && "opacity-55",
              )}
            >
              {i < TRAIL.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[5px] left-[calc(50%+8px)] right-[calc(-50%+8px)] h-0.5",
                    done && !cancelled ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "relative z-1 size-[12px] rounded-full border-2 box-border",
                  filled
                    ? stop
                      ? "border-destructive bg-destructive"
                      : "border-primary bg-primary"
                    : "border-border bg-card",
                  here && "shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--primary)]",
                )}
              />
              <span>{COPY.status[step]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ChannelChip({ list, moq }: { list: "varejo" | "atacado"; moq?: number }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {list === "atacado" ? (
        <Badge className="border-transparent bg-[var(--brand-accent)] text-[var(--brand-accent-foreground)]">
          {COPY.stock.atacado}
        </Badge>
      ) : (
        <Badge variant="outline" className="border-primary text-primary">
          {COPY.stock.varejo}
        </Badge>
      )}
      {list === "atacado" && moq ? (
        <span className="text-xs text-muted-foreground">{COPY.stock.qtd_min(moq)}</span>
      ) : null}
    </span>
  );
}

export function RoleChip({ label }: { label: string }) {
  return (
    <Badge className="border-transparent bg-[var(--brand-accent)] text-[var(--brand-accent-foreground)]">
      {label}
    </Badge>
  );
}

export function PriceLine({
  list,
  cents,
  moq,
  size = "md",
}: {
  list: "varejo" | "atacado";
  cents: number;
  moq?: number;
  size?: "md" | "lg";
}) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-2">
      <strong
        className={cn(
          "font-semibold tabular-nums text-primary",
          size === "lg" ? "text-2xl" : "text-base",
        )}
      >
        {formatMoney(cents)}
      </strong>
      <ChannelChip list={list} moq={list === "atacado" ? moq : undefined} />
    </p>
  );
}
