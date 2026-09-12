"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, EyeOff, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, apiSend, asPage, isApiError, skuCode, type EstoqueItemDto } from "../api";
import { COPY } from "../copy";
import { DeskWrap, ListHeader, SaasMain } from "../layout";
import { useSession, writesOpen } from "../session";
import { EmptyState, ErrorState, TableSkeleton } from "../states";
import { KpiStrip } from "./KpiStrip";

export function EstoqueScreen() {
  const { session, status } = useSession();
  const supervisor = session?.saas_role === "supervisor";
  const warehouse = session?.saas_role === "estoquista";
  const allowed = writesOpen(session);
  const [items, setItems] = useState<EstoqueItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<unknown>("/api/saas/estoque");
      setItems(asPage<EstoqueItemDto>(data).items);
    } catch (err) {
      setItems(null);
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, []);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  async function toggle(item: EstoqueItemDto) {
    setToggleError(null);
    try {
      await apiSend(`/api/saas/estoque/${item.id}/visibilidade`, "PATCH", { visivel_loja: !item.visivel_loja });
      await load();
    } catch (err) {
      setToggleError(isApiError(err) ? err.message : COPY.errors.save_error);
    }
  }

  const kpis = useMemo(() => {
    const loaded = items ?? [];
    return [
      { id: "skus", label: COPY.saas.kpi_skus, value: loaded.length, icon: Boxes },
      { id: "hidden", label: COPY.saas.kpi_hidden, value: loaded.filter((item) => !item.visivel_loja).length, icon: EyeOff },
      { id: "zero", label: COPY.saas.kpi_zero, value: loaded.filter((item) => (item.available ?? Math.max(0, item.on_hand - item.reserved)) <= 0).length, icon: PackageX },
    ];
  }, [items]);

  return (
    <SaasMain>
      <ListHeader title={COPY.saas.nav.estoque} subtitle={COPY.saas.sub_estoque} />
      {supervisor ? <p className="mb-3 text-xs text-muted-foreground">{COPY.saas.toggle_hint}</p> : null}
      <KpiStrip items={kpis} loading={(status === "loading" || items === null) && !error} />
      {(status === "loading" || items === null) && !error ? <TableSkeleton rows={8} /> : null}
      {error ? (
        <DeskWrap className="p-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </DeskWrap>
      ) : null}
      {items && items.length === 0 ? (
        <DeskWrap>
          <EmptyState
            title={COPY.saas.empty_skus}
            art="warehouse"
            action={
              supervisor ? (
                <Button variant="link" asChild>
                  <Link href="/saas/chat-estoque">{COPY.saas.chat_title}</Link>
                </Button>
              ) : undefined
            }
          />
        </DeskWrap>
      ) : null}
      {toggleError ? <FieldError>{toggleError}</FieldError> : null}
      {items && items.length > 0 ? (
        <>
          <DeskWrap className={warehouse ? "hidden md:block" : undefined}>
            <Table>
              <TableHeader className="bg-muted/60 [&_tr]:h-11">
                <TableRow>
                  <TableHead>{COPY.saas.col_sku}</TableHead>
                  <TableHead>{COPY.saas.col_nome}</TableHead>
                  <TableHead className="text-right">{COPY.stock.on_hand}</TableHead>
                  <TableHead className="text-right">{COPY.stock.reserved}</TableHead>
                  <TableHead className="text-right">{COPY.stock.available}</TableHead>
                  {supervisor ? <TableHead>{COPY.stock.visivel_loja}</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:h-12">
                {items.map((item) => {
                  const available = item.available ?? Math.max(0, item.on_hand - item.reserved);
                  const code = skuCode(item);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/40">
                      <TableCell className="font-semibold">
                        <Link href={`/saas/estoque/${item.id}`} className="font-semibold text-foreground hover:text-primary">
                          {code}
                        </Link>
                      </TableCell>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.on_hand}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.reserved}</TableCell>
                      <TableCell className="text-right tabular-nums">{available}</TableCell>
                      {supervisor ? (
                        <TableCell>
                          <Switch
                            checked={item.visivel_loja}
                            disabled={!allowed}
                            aria-label={`${COPY.stock.visivel_loja}, SKU ${code}`}
                            onCheckedChange={() => void toggle(item)}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DeskWrap>
          {warehouse ? (
            <div className="flex flex-col gap-3 md:hidden">
              {items.map((item) => {
                const available = item.available ?? Math.max(0, item.on_hand - item.reserved);
                const code = skuCode(item);
                return (
                  <article key={item.id} className="rounded-xl border border-border bg-card p-5">
                    <h2 className="m-0 text-lg font-semibold">
                      <Link href={`/saas/estoque/${item.id}`} className="text-foreground hover:text-primary">
                        {code}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm">{item.nome}</p>
                    <p className="m-0 text-sm">
                      {COPY.stock.on_hand}: <span className="tabular-nums">{item.on_hand}</span>
                    </p>
                    <p className="m-0 text-sm">
                      {COPY.stock.reserved}: <span className="tabular-nums">{item.reserved}</span>
                    </p>
                    <p className="m-0 text-sm">
                      {COPY.stock.available}: <span className="tabular-nums">{available}</span>
                    </p>
                  </article>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </SaasMain>
  );
}
