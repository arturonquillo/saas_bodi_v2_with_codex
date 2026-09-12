"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderStatus } from "@saas-frota/shared";
import { CircleCheck, ClipboardList, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, asPage, isApiError, normalizeOrder, type OrderDto } from "../api";
import { COPY } from "../copy";
import { firstName, formatDate, formatMoney } from "../format";
import { DeskWrap, ListHeader, SaasMain } from "../layout";
import { legalTargets, StatusBadge } from "../order-ui";
import { useSession, writesOpen } from "../session";
import { EmptyState, ErrorState, TableSkeleton } from "../states";
import { KpiStrip, type KpiItem } from "./KpiStrip";
import { emptyPedidos, pedidosSubtitle, pedidosTitle } from "./nav";
import { TransitionActions } from "./TransitionActions";

const ALL: OrderStatus[] = ["novo", "confirmado", "separando", "despachado", "entregue", "cancelado"];

function countStatus(items: ReturnType<typeof normalizeOrder>[], status: OrderStatus) {
  return items.filter((order) => order.status === status).length;
}

export function PedidosScreen() {
  const { session, status } = useSession();
  const role = session?.saas_role;
  const locked =
    role === "estoquista"
      ? (["confirmado", "separando", "despachado"] as OrderStatus[])
      : role === "entregador"
        ? (["despachado", "entregue"] as OrderStatus[])
        : null;
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [items, setItems] = useState<ReturnType<typeof normalizeOrder>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const cards = role === "estoquista" || role === "entregador";
  const canCreate = (role === "supervisor" || role === "vendedor") && writesOpen(session);

  const load = useCallback(async (next?: string | null, append = false) => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (next) params.set("cursor", next);
      const qs = params.toString();
      const data = await apiGet<unknown>(`/api/saas/pedidos${qs ? `?${qs}` : ""}`);
      const page = asPage<OrderDto>(data);
      const normalized = page.items.map(normalizeOrder);
      setItems((prev) => (append && prev ? [...prev, ...normalized] : normalized));
      setCursor(page.next_cursor);
    } catch (err) {
      if (!append) setItems(null);
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, []);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  const visible = useMemo(() => {
    if (!items) return [];
    const base = locked ? items.filter((o) => locked.includes(o.status)) : items;
    if (filter !== "all") return base.filter((o) => o.status === filter);
    return base;
  }, [items, locked, filter]);

  const kpis = useMemo((): KpiItem[] => {
    const loaded = items ?? [];
    const toggle = (status: OrderStatus) => ({
      active: filter === status,
      onSelect: () => setFilter((current) => (current === status ? "all" : status)),
    });
    if (role === "estoquista") {
      return [
        { id: "confirmado", label: COPY.saas.kpi_confirmado, value: countStatus(loaded, "confirmado"), icon: ClipboardList, ...toggle("confirmado") },
        { id: "separando", label: COPY.saas.kpi_separando, value: countStatus(loaded, "separando"), icon: Package, ...toggle("separando") },
        { id: "despachado", label: COPY.saas.kpi_despachado, value: countStatus(loaded, "despachado"), icon: Truck, ...toggle("despachado") },
      ];
    }
    if (role === "entregador") {
      return [
        { id: "despachado", label: COPY.saas.kpi_despachado, value: countStatus(loaded, "despachado"), icon: Truck, ...toggle("despachado") },
        { id: "entregue", label: COPY.saas.kpi_entregue, value: countStatus(loaded, "entregue"), icon: CircleCheck, ...toggle("entregue") },
      ];
    }
    return [
      { id: "novo", label: COPY.saas.kpi_novo, value: countStatus(loaded, "novo"), icon: ClipboardList, ...toggle("novo") },
      { id: "separando", label: COPY.saas.kpi_separando, value: countStatus(loaded, "separando"), icon: Package, ...toggle("separando") },
      { id: "despachado", label: COPY.saas.kpi_despachado, value: countStatus(loaded, "despachado"), icon: Truck, ...toggle("despachado") },
      { id: "entregue", label: COPY.saas.kpi_entregue, value: countStatus(loaded, "entregue"), icon: CircleCheck, ...toggle("entregue") },
    ];
  }, [items, filter, role]);

  return (
    <SaasMain>
      <ListHeader
        title={pedidosTitle(role)}
        subtitle={pedidosSubtitle(role)}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/saas/pedidos/novo">{COPY.saas.novo_pedido}</Link>
            </Button>
          ) : null
        }
        filters={
          !locked && role ? (
            <Field orientation="horizontal" className="max-w-xs">
              <FieldLabel>{COPY.saas.filter_status}</FieldLabel>
              <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatus | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{COPY.saas.filter_todos}</SelectItem>
                  {ALL.map((s) => (
                    <SelectItem key={s} value={s}>
                      {COPY.status[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null
        }
      />
      <KpiStrip items={kpis} loading={(status === "loading" || items === null) && !error} />
      {(status === "loading" || items === null) && !error ? <TableSkeleton rows={8} /> : null}
      {error ? (
        <DeskWrap className="p-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </DeskWrap>
      ) : null}
      {items && visible.length === 0 ? (
        <DeskWrap>
          <EmptyState
            title={emptyPedidos(role)}
            art={role === "estoquista" || role === "entregador" ? "warehouse" : "pedidos"}
            action={
              canCreate ? (
                <Button asChild>
                  <Link href="/saas/pedidos/novo">{COPY.saas.novo_pedido}</Link>
                </Button>
              ) : undefined
            }
          />
        </DeskWrap>
      ) : null}
      {items && visible.length > 0 && !cards ? (
        <DeskWrap>
          <Table>
            <TableHeader className="bg-muted/60 [&_tr]:h-11">
              <TableRow>
                <TableHead>{COPY.saas.col_pedido}</TableHead>
                <TableHead>{COPY.saas.customer}</TableHead>
                <TableHead>{COPY.saas.filter_status}</TableHead>
                <TableHead className="text-right">{COPY.saas.col_total}</TableHead>
                <TableHead>{COPY.saas.col_updated}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:h-12">
              {visible.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/40">
                  <TableCell className="font-semibold">
                    <Link href={`/saas/pedidos/${order.id}`} className="font-semibold text-foreground hover:text-primary">
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {order.customer_nome} {order.customer_document_masked ? `· ${order.customer_document_masked}` : ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(order.total_centavos)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.updated_at ?? order.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DeskWrap>
      ) : null}
      {items && visible.length > 0 && cards ? (
        <div className="flex flex-col gap-3">
          {visible.map((order) => {
            const primary = legalTargets(role, order.status).find((t) => t !== "cancelado");
            return (
              <Card key={order.id} className="rounded-xl py-4 shadow-none">
                <CardContent className="space-y-3 px-5">
                  <h2 className="m-0 text-lg font-semibold">
                    <Link href={`/saas/pedidos/${order.id}`} className="text-inherit no-underline">
                      {order.id} · {firstName(order.customer_nome)}
                    </Link>
                  </h2>
                  <StatusBadge status={order.status} />
                  {primary ? (
                    <TransitionActions
                      orderId={order.id}
                      status={order.status}
                      role={role}
                      hit="warehouse"
                      onDone={() => void load()}
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
      {cursor ? (
        <Button type="button" variant="outline" className="mt-4" onClick={() => void load(cursor, true)}>
          {COPY.saas.load_more}
        </Button>
      ) : null}
    </SaasMain>
  );
}
