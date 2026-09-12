"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SubscriptionStatus } from "@saas-frota/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet, apiSend, isApiError, type AssinaturaDto } from "../api";
import { COPY } from "../copy";
import { ACCOUNT_CARD } from "../layout";
import { PlanBadge } from "../order-ui";
import { useSession } from "../session";
import { CardSkeleton, ErrorState, ForbiddenState } from "../states";

export function AssinaturaScreen() {
  const { status, forbidden } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AssinaturaDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<SubscriptionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiGet<AssinaturaDto>("/api/conta/assinatura"));
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        router.replace("/conta/entrar?return=/conta");
        return;
      }
      if (isApiError(err) && (err.status === 403 || err.code === "forbidden")) {
        setError("forbidden");
        return;
      }
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, [router]);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/conta/entrar?return=/conta");
      return;
    }
    if (status === "auth") void load();
  }, [status, load, router]);

  async function apply(next: SubscriptionStatus) {
    setBusy(true);
    setSaveError(null);
    try {
      const updated = await apiSend<AssinaturaDto>("/api/conta/assinatura", "POST", { subscription_status: next });
      setData(updated);
      setPending(null);
      setChanged(true);
    } catch {
      setSaveError(COPY.account.save_error);
    } finally {
      setBusy(false);
    }
  }

  if (forbidden || error === "forbidden") {
    return (
      <main id="conteudo" className="mx-auto max-w-[480px] px-4 py-6">
        <ForbiddenState message={COPY.account.forbidden} />
      </main>
    );
  }

  if (status === "loading" || (!data && !error)) {
    return (
      <main id="conteudo" className="mx-auto max-w-[480px] px-4 py-6">
        <CardSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main id="conteudo" className="mx-auto max-w-[480px] px-4 py-6">
        <ErrorState message={error} onRetry={() => void load()} />
      </main>
    );
  }

  if (!data) return null;

  const current = data.subscription_status;
  const actions: { to: SubscriptionStatus; label: string; kind: "default" | "outline" | "destructive" }[] =
    current === "ativa"
      ? [
          { to: "inadimplente", label: COPY.account.marcar_inadimplente, kind: "outline" },
          { to: "cancelada", label: COPY.account.cancelar_assinatura, kind: "destructive" },
        ]
      : current === "inadimplente"
        ? [
            { to: "ativa", label: COPY.account.reativar, kind: "default" },
            { to: "cancelada", label: COPY.account.cancelar_assinatura, kind: "destructive" },
          ]
        : [{ to: "ativa", label: COPY.account.reativar, kind: "default" }];

  const confirmText =
    pending === "inadimplente"
      ? COPY.account.confirm_inadimplente
      : pending === "cancelada"
        ? COPY.account.confirm_cancel
        : COPY.account.confirm_reativar;

  return (
    <main id="conteudo" className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 py-6">
      <Card className={ACCOUNT_CARD}>
        <CardContent className="space-y-4 p-0">
          <p className="m-0 text-sm text-muted-foreground">{COPY.account.plan}</p>
          <h1 className="m-0 text-[28px] font-semibold">{data.plan_display_name}</h1>
          <PlanBadge status={current} />
          {changed ? (
            <Alert>
              <AlertDescription>
                {current === "ativa" ? COPY.entitlement.account_effect_unlock : COPY.entitlement.account_effect_lock}
              </AlertDescription>
            </Alert>
          ) : null}
          {saveError ? (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-3">
            {actions.map((a) => (
              <Button
                key={a.to}
                type="button"
                variant={a.kind}
                className="h-11 w-full"
                onClick={() => setPending(a.to)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmText}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{COPY.actions.cancelar}</AlertDialogCancel>
            <AlertDialogAction
              variant={pending === "ativa" ? "default" : "destructive"}
              disabled={busy}
              onClick={() => pending && void apply(pending)}
            >
              {COPY.actions.confirmar}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
