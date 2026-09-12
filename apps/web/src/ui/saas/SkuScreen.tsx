"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  apiGet,
  apiSend,
  asPage,
  isApiError,
  skuCode,
  type EstoqueItemDto,
  type MovementDto,
} from "../api";
import { COPY } from "../copy";
import { formatDate } from "../format";
import { DeskWrap, FormWrap, SaasMain } from "../layout";
import { useSession, writesOpen } from "../session";
import { ErrorState, FormSkeleton, TableSkeleton } from "../states";

export function SkuScreen({ id }: { id: string }) {
  const { session, status } = useSession();
  const role = session?.saas_role;
  const canWrite = (role === "supervisor" || role === "estoquista") && writesOpen(session);
  const canToggle = role === "supervisor" && writesOpen(session);
  const [item, setItem] = useState<EstoqueItemDto | null>(null);
  const [moves, setMoves] = useState<MovementDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onHand, setOnHand] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sku, mov] = await Promise.all([
        apiGet<EstoqueItemDto>(`/api/saas/estoque/${id}`),
        apiGet<unknown>(`/api/saas/estoque/${id}/movimentos`),
      ]);
      setItem(sku);
      setOnHand(String(sku.on_hand));
      setMoves(asPage<MovementDto>(mov).items);
    } catch (err) {
      setItem(null);
      setMoves(null);
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, [id]);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  async function adjust(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      await apiSend(`/api/saas/estoque/${id}/ajuste`, "POST", { on_hand: Number(onHand), reason: motivo });
      setMotivo("");
      await load();
    } catch (err) {
      setSaveError(isApiError(err) ? err.message : COPY.errors.save_error);
    }
  }

  async function toggle() {
    if (!item) return;
    setSaveError(null);
    try {
      await apiSend(`/api/saas/estoque/${id}/visibilidade`, "PATCH", { visivel_loja: !item.visivel_loja });
      await load();
    } catch (err) {
      setSaveError(isApiError(err) ? err.message : COPY.errors.save_error);
    }
  }

  if (error) {
    return (
      <SaasMain>
        <ErrorState message={error} onRetry={() => void load()} />
      </SaasMain>
    );
  }

  if (!item) {
    return (
      <SaasMain>
        <FormSkeleton />
      </SaasMain>
    );
  }

  const available = item.available ?? Math.max(0, item.on_hand - item.reserved);
  const code = skuCode(item);

  return (
    <SaasMain>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/saas/estoque">{COPY.saas.nav.estoque}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{code}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-[18px] font-semibold md:text-[20px]">{item.nome}</h1>
          <p className="m-0 text-xs text-muted-foreground">{code}</p>
        </div>
        {canWrite ? (
          <Button type="submit" form="sku-ajuste">
            {COPY.saas.adjust}
          </Button>
        ) : null}
      </div>
      {saveError ? <FieldError>{saveError}</FieldError> : null}
      <FormWrap className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{COPY.saas.section_qty}</h2>
          <Separator />
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">{COPY.stock.on_hand}</dt>
              <dd className="m-0 tabular-nums">{item.on_hand}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{COPY.stock.reserved}</dt>
              <dd className="m-0 tabular-nums">{item.reserved}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{COPY.stock.available}</dt>
              <dd className="m-0 tabular-nums">{available}</dd>
            </div>
          </dl>
        </section>
        {role === "supervisor" ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{COPY.stock.visivel_loja}</h2>
            <Separator />
            <div className="flex items-center gap-3">
              <Switch
                checked={item.visivel_loja}
                disabled={!canToggle}
                aria-label={`${COPY.stock.visivel_loja}, SKU ${code}`}
                onCheckedChange={() => void toggle()}
              />
              <span className="text-sm">{item.visivel_loja ? COPY.saas.visible_on : COPY.saas.visible_off}</span>
            </div>
            {!canToggle ? <p className="m-0 text-xs text-muted-foreground">{COPY.entitlement.saas_ro_inadimplente}</p> : null}
            <p className="m-0 text-xs text-muted-foreground">{COPY.saas.toggle_hint}</p>
          </section>
        ) : null}
        {canWrite ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{COPY.saas.adjust}</h2>
            <Separator />
            <form id="sku-ajuste" className="flex max-w-md flex-col gap-3" onSubmit={(e) => void adjust(e)}>
              <Field>
                <FieldLabel>{COPY.saas.adjust}</FieldLabel>
                <Input value={onHand} onChange={(e) => setOnHand(e.target.value)} inputMode="numeric" />
              </Field>
              <Field>
                <FieldLabel>{COPY.saas.adjust_reason}</FieldLabel>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
              </Field>
              <Button type="submit">{COPY.saas.adjust_submit}</Button>
            </form>
          </section>
        ) : null}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{COPY.saas.movements}</h2>
          <Separator />
          {moves === null ? <TableSkeleton rows={3} /> : null}
          {moves && moves.length === 0 ? <p className="m-0 text-sm text-muted-foreground">{COPY.saas.empty_skus}</p> : null}
          {moves && moves.length > 0 ? (
            <DeskWrap>
              <Table>
                <TableHeader className="bg-muted [&_tr]:h-10">
                  <TableRow>
                    <TableHead>{COPY.saas.col_date}</TableHead>
                    <TableHead className="text-right">{COPY.stock.on_hand}</TableHead>
                    <TableHead className="text-right">{COPY.stock.reserved}</TableHead>
                    <TableHead>{COPY.saas.adjust_reason}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:h-10">
                  {moves.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold">{formatDate(m.created_at)}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.delta_on_hand ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.delta_reserved ?? 0}</TableCell>
                      <TableCell>{m.reason ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DeskWrap>
          ) : null}
        </section>
      </FormWrap>
    </SaasMain>
  );
}
