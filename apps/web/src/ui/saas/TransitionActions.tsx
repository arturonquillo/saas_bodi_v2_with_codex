"use client";

import { useState } from "react";
import type { OrderStatus, SaasRole } from "@saas-frota/shared";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { apiSend, isApiError } from "../api";
import { COPY } from "../copy";
import { legalTargets, transitionLabel } from "../order-ui";
import { useSession, writesOpen } from "../session";

export function TransitionActions({
  orderId,
  status,
  role,
  hit,
  onDone,
}: {
  orderId: string;
  status: OrderStatus;
  role: SaasRole | null | undefined;
  hit?: "default" | "warehouse";
  onDone: () => void;
}) {
  const { session } = useSession();
  const allowed = writesOpen(session);
  const targets = legalTargets(role, status);
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(to: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      await apiSend(`/api/saas/pedidos/${orderId}/transicao`, "POST", { para: to });
      setPending(null);
      onDone();
    } catch (err) {
      if (isApiError(err) && (err.status === 409 || err.status === 403)) {
        toast.error(err.message);
        setPending(null);
        onDone();
      } else {
        setError(isApiError(err) ? err.message : COPY.errors.save_error);
      }
    } finally {
      setBusy(false);
    }
  }

  function click(to: OrderStatus) {
    if (to === "despachado" || to === "cancelado") setPending(to);
    else void run(to);
  }

  if (!targets.length) return error ? <FieldError>{error}</FieldError> : null;

  return (
    <div className={cn(hit === "warehouse" ? "flex flex-col gap-3" : "flex flex-wrap items-center gap-2")}>
      {targets.map((to) => (
        <Button
          key={to}
          type="button"
          variant={to === "cancelado" ? "outline" : "default"}
          className={cn(
            to === "cancelado" && "border-destructive text-destructive hover:bg-destructive/10",
            hit === "warehouse" && "h-[52px] w-full",
          )}
          disabled={!allowed || busy}
          onClick={() => click(to)}
        >
          {transitionLabel(to)}
        </Button>
      ))}
      {!allowed ? <p className="m-0 text-xs text-muted-foreground">{COPY.entitlement.saas_ro_inadimplente}</p> : null}
      {error ? <FieldError>{error}</FieldError> : null}
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "despachado" ? COPY.saas.confirm_dispatch : COPY.saas.cancel_confirm}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{COPY.actions.cancelar}</AlertDialogCancel>
            <AlertDialogAction
              variant={pending === "cancelado" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => pending && void run(pending)}
            >
              {COPY.actions.confirmar}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
