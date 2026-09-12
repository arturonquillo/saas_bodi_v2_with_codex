"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CanalAviso } from "@saas-frota/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, isApiError, normalizeOrder, type OrderDto, type SaasConfigDto } from "../api";
import { COPY } from "../copy";
import { formatDate, formatMoney } from "../format";
import { DeskWrap, FormWrap, SaasMain } from "../layout";
import { ChannelChip, notifyCopy, StatusBadge, StatusTrail } from "../order-ui";
import { useSession } from "../session";
import { EmptyState, ErrorState, FormSkeleton } from "../states";
import { TransitionActions } from "./TransitionActions";

export function PedidoDetailScreen({ id }: { id: string }) {
  const { session, status } = useSession();
  const [order, setOrder] = useState<ReturnType<typeof normalizeOrder> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [canais, setCanais] = useState<CanalAviso>("ambos");
  const [notify, setNotify] = useState<{ customer: string; seller: string } | null>(null);
  const warehouse = session?.saas_role === "estoquista" || session?.saas_role === "entregador";

  const load = useCallback(async () => {
    setError(null);
    setMissing(false);
    try {
      const data = await apiGet<OrderDto>(`/api/saas/pedidos/${id}`);
      setOrder(normalizeOrder(data));
    } catch (err) {
      setOrder(null);
      if (
        isApiError(err) &&
        (err.status === 404 || err.status === 403 || err.code === "nao_encontrado" || err.code === "forbidden")
      ) {
        setMissing(true);
        return;
      }
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, [id]);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  useEffect(() => {
    if (session?.saas_role !== "supervisor") return;
    void apiGet<SaasConfigDto>("/api/saas/config")
      .then((cfg) => setCanais(cfg.canais_aviso))
      .catch(() => setCanais("ambos"));
  }, [session?.saas_role]);

  return (
    <SaasMain>
      {status === "loading" || (!order && !error && !missing) ? <FormSkeleton /> : null}
      {missing ? <EmptyState title={COPY.store.order_not_found} art="pedidos" /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {order ? (
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/saas/pedidos">{COPY.saas.nav.pedidos}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{order.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-[18px] font-semibold md:text-[20px]">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <StatusTrail status={order.status} />
          <div className={warehouse ? "flex flex-col gap-3" : undefined}>
            <TransitionActions
              orderId={order.id}
              status={order.status}
              role={session?.saas_role}
              hit={warehouse ? "warehouse" : "default"}
              onDone={() => {
                setNotify(notifyCopy(canais));
                void load();
              }}
            />
          </div>
          {notify ? (
            <Alert aria-live="polite" className="bg-[var(--color-success)]/10">
              <AlertDescription>
                <p className="m-0">{notify.customer}</p>
                <p className="m-0">{notify.seller}</p>
              </AlertDescription>
            </Alert>
          ) : null}
          <FormWrap className="space-y-5">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">{COPY.saas.section_items}</h2>
              <Separator />
              <DeskWrap>
                <Table>
                  <TableHeader className="bg-muted [&_tr]:h-10">
                    <TableRow>
                      <TableHead>{COPY.saas.col_nome}</TableHead>
                      <TableHead>{COPY.store.qty}</TableHead>
                      <TableHead className="text-right">{COPY.saas.unit_price}</TableHead>
                      <TableHead />
                      <TableHead className="text-right">{COPY.saas.col_total}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr]:h-10">
                    {order.linhas.map((line) => {
                      const list = line.price_list ?? order.price_list ?? "varejo";
                      return (
                        <TableRow key={line.id ?? `${line.sku_id}-${line.nome}`}>
                          <TableCell className="font-semibold">{line.nome}</TableCell>
                          <TableCell className="tabular-nums">{line.qty}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(line.unit_price_centavos)}
                          </TableCell>
                          <TableCell>
                            <ChannelChip list={list} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(line.qty * line.unit_price_centavos)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </DeskWrap>
              <p className="m-0 font-semibold tabular-nums">
                {COPY.saas.col_total}: {formatMoney(order.total_centavos)}
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">{COPY.saas.customer}</h2>
              <Separator />
              <p className="m-0">
                {order.customer_nome}
                {order.customer_document_masked ? ` · ${order.customer_document_masked}` : ""}
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">{COPY.saas.history}</h2>
              <Separator />
              <ul className="m-0 list-none p-0">
                {order.history.map((h, i) => (
                  <li key={`${h.to_status}-${i}`} className="border-b border-border py-2">
                    {COPY.status[h.to_status as keyof typeof COPY.status] ?? h.to_status} · {formatDate(h.created_at)}
                  </li>
                ))}
              </ul>
            </section>
          </FormWrap>
        </div>
      ) : null}
    </SaasMain>
  );
}
