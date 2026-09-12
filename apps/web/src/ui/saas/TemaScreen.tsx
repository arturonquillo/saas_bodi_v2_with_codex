"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThemeTokens } from "@saas-frota/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, apiSend, isApiError } from "../api";
import { COPY } from "../copy";
import { DeskWrap, FormWrap, ListHeader, SaasMain } from "../layout";
import { StatusBadge } from "../order-ui";
import { useSession, writesOpen } from "../session";
import { ErrorState, FormSkeleton } from "../states";
import { themePassesContrast, themeStyle } from "../theme/apply-tokens";
import { useTenantTheme } from "../theme/TenantTheme";

const EMPTY: ThemeTokens = {
  marca: "",
  primary: "#0F4F3E",
  accent: "#C2410C",
  background: "#F6EFE3",
  logo_url: null,
};

export function TemaScreen() {
  const { session, status } = useSession();
  const { refresh } = useTenantTheme();
  const allowed = writesOpen(session);
  const [saved, setSaved] = useState<ThemeTokens | null>(null);
  const [draft, setDraft] = useState<ThemeTokens>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoBroken, setLogoBroken] = useState(false);
  const [dirtyOpen, setDirtyOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<ThemeTokens>("/api/saas/tema");
      setSaved(data);
      setDraft(data);
    } catch (err) {
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, []);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  useEffect(() => {
    function onLeave(e: BeforeUnloadEvent) {
      if (saved && JSON.stringify(saved) !== JSON.stringify(draft)) {
        e.preventDefault();
        e.returnValue = COPY.saas.theme_dirty;
      }
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [saved, draft]);

  const contrastOk = useMemo(() => themePassesContrast(draft), [draft]);
  const dirty = saved && JSON.stringify(saved) !== JSON.stringify(draft);

  async function save() {
    setSaveError(null);
    if (!contrastOk) return;
    try {
      const next = await apiSend<ThemeTokens>("/api/saas/tema", "PUT", draft);
      setSaved(next);
      setDraft(next);
      await refresh();
    } catch (err) {
      setSaveError(isApiError(err) ? err.message : COPY.errors.save_error);
    }
  }

  function cancel() {
    if (dirty) {
      setDirtyOpen(true);
      return;
    }
    if (saved) setDraft(saved);
  }

  if (error) {
    return (
      <SaasMain>
        <ErrorState message={error} onRetry={() => void load()} />
      </SaasMain>
    );
  }

  if (!saved) {
    return (
      <SaasMain>
        <FormSkeleton />
      </SaasMain>
    );
  }

  return (
    <SaasMain>
      <ListHeader
        title={COPY.saas.theme_title}
        subtitle={COPY.saas.sub_tema}
        actions={
          <>
            <Button type="button" disabled={!allowed || !contrastOk} onClick={() => void save()}>
              {COPY.saas.theme_save}
            </Button>
            <Button type="button" variant="outline" onClick={cancel}>
              {COPY.actions.cancelar}
            </Button>
          </>
        }
      />
      {!allowed ? <p className="mb-3 text-xs text-muted-foreground">{COPY.entitlement.saas_ro_inadimplente}</p> : null}
      {!contrastOk ? <FieldError className="mb-3">{COPY.saas.theme_contrast}</FieldError> : null}
      {saveError ? <FieldError className="mb-3">{saveError}</FieldError> : null}
      <FormWrap>
        <div className="grid gap-6 min-[900px]:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>{COPY.saas.theme_marca}</FieldLabel>
              <Input value={draft.marca} onChange={(e) => setDraft({ ...draft, marca: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>{COPY.saas.theme_primary}</FieldLabel>
              <Input type="color" value={draft.primary} onChange={(e) => setDraft({ ...draft, primary: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>{COPY.saas.theme_accent}</FieldLabel>
              <Input type="color" value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>{COPY.saas.theme_background}</FieldLabel>
              <Input
                type="color"
                value={draft.background}
                onChange={(e) => setDraft({ ...draft, background: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>{COPY.saas.theme_logo}</FieldLabel>
              <Input
                value={draft.logo_url ?? ""}
                onChange={(e) => {
                  setLogoBroken(false);
                  setDraft({ ...draft, logo_url: e.target.value || null });
                }}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoBroken(false);
                  setDraft({ ...draft, logo_url: URL.createObjectURL(file) });
                }}
              />
            </Field>
          </div>
          <section
            className="space-y-3 overflow-hidden rounded-md border border-border p-4"
            style={themeStyle(draft)}
            data-theme="tenant"
            data-density="compact"
          >
            <h2 className="m-0 text-sm font-semibold">{COPY.saas.theme_preview}</h2>
            <div className="flex flex-wrap gap-4">
              <nav className="flex w-40 flex-col border border-border bg-sidebar py-2" aria-label="SaaS">
                <span className="flex h-8 items-center bg-primary/8 px-3 text-[13px] font-semibold shadow-[-3px_0_0_0_var(--primary)]">
                  {COPY.saas.nav.pedidos}
                </span>
                <span className="flex h-8 items-center px-3 text-[13px]">{COPY.saas.nav.estoque}</span>
              </nav>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button">{COPY.store.add}</Button>
                  <Button type="button" variant="outline">
                    {COPY.actions.cancelar}
                  </Button>
                  <p className="m-0 font-semibold tabular-nums text-primary">R$ 12,00</p>
                  <StatusBadge status="confirmado" />
                  <Badge variant="outline">{COPY.status.novo}</Badge>
                </div>
                <DeskWrap>
                  <Table>
                    <TableHeader className="bg-muted [&_tr]:h-10">
                      <TableRow>
                        <TableHead>{COPY.saas.col_sku}</TableHead>
                        <TableHead className="text-right">{COPY.stock.available}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr]:h-10">
                      <TableRow>
                        <TableCell className="font-semibold">CAMISETA-BASICA</TableCell>
                        <TableCell className="text-right tabular-nums">45</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </DeskWrap>
                {draft.logo_url ? (
                  logoBroken ? (
                    <p className="m-0 text-sm">{COPY.saas.theme_logo_missing}</p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.logo_url}
                      alt={draft.marca}
                      className="max-h-10"
                      onError={() => setLogoBroken(true)}
                    />
                  )
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </FormWrap>
      <AlertDialog open={dirtyOpen} onOpenChange={setDirtyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{COPY.saas.theme_dirty}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.actions.cancelar}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (saved) setDraft(saved);
                setDirtyOpen(false);
              }}
            >
              {COPY.actions.confirmar}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SaasMain>
  );
}
