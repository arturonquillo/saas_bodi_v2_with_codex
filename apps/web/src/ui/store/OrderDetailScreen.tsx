"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, isApiError, normalizeOrder, type OrderDto } from "../api";
import { COPY } from "../copy";
import { formatDate, formatMoney } from "../format";
import { StoreMain } from "../layout";
import { ChannelChip, StatusBadge, StatusTrail } from "../order-ui";
import { useSession } from "../session";
import { CardSkeleton, EmptyState, ErrorState } from "../states";

export function StoreOrderDetailScreen({ id }: { id: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<ReturnType<typeof normalizeOrder> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setMissing(false);
    try {
      const data = await apiGet<OrderDto>(`/api/loja/pedidos/${id}`);
      setOrder(normalizeOrder(data));
    } catch (err) {
      setOrder(null);
      if (isApiError(err) && err.status === 401) {
        router.replace(`/loja/entrar?return=/loja/pedidos/${id}`);
        return;
      }
      if (
        isApiError(err) &&
        (err.status === 404 || err.status === 403 || err.code === "nao_encontrado" || err.code === "forbidden")
      ) {
        setMissing(true);
        return;
      }
      setError(isApiError(err) ? err.message : COPY.store.load_error);
    }
  }, [id, router]);

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/loja/entrar?return=/loja/pedidos/${id}`);
      return;
    }
    if (status === "auth") void load();
  }, [status, load, router, id]);

  return (
    <StoreMain className="max-w-[720px]">
      {status === "loading" || (!order && !error && !missing) ? <CardSkeleton /> : null}
      {missing ? (
        <EmptyState
          title={COPY.store.order_not_found}
          art="pedidos"
          action={
            <Button variant="link" asChild>
              <Link href="/loja/pedidos">{COPY.store.nav_pedidos}</Link>
            </Button>
          }
        />
      ) : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {order ? (
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/loja">{COPY.store.breadcrumb_inicio}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/loja/pedidos">{COPY.store.nav_pedidos}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{order.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-2xl font-semibold">{COPY.store.pedido_n(order.id)}</h1>
            <StatusBadge status={order.status} />
          </div>
          <StatusTrail status={order.status} />
          {order.customer_document_masked ? (
            <p className="m-0 text-sm">
              {COPY.saas.customer}: {order.customer_document_masked}
            </p>
          ) : null}
          <div>
            <h2 className="mb-2 text-sm font-semibold">{COPY.saas.section_items}</h2>
            <Separator className="mb-3" />
            <div className="overflow-x-auto rounded-sm border border-border bg-card">
              <Table>
                <TableHeader className="bg-muted [&_tr]:h-10">
                  <TableRow>
                    <TableHead>{COPY.saas.col_nome}</TableHead>
                    <TableHead>{COPY.store.qty}</TableHead>
                    <TableHead className="text-right">{COPY.saas.unit_price}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:h-10">
                  {order.linhas.map((line) => (
                    <TableRow key={line.id ?? `${line.sku_id}-${line.nome}`}>
                      <TableCell className="font-semibold">{line.nome}</TableCell>
                      <TableCell className="tabular-nums">{line.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(line.unit_price_centavos)}</TableCell>
                      <TableCell>
                        <ChannelChip list={line.price_list ?? order.price_list ?? "varejo"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xl font-semibold tabular-nums">Total: {formatMoney(order.total_centavos)}</p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold">{COPY.saas.history}</h2>
            <Separator className="mb-3" />
            <ul className="m-0 list-none p-0">
              {order.history.length === 0 ? (
                <li className="border-b border-border py-2">Aviso registrado</li>
              ) : (
                order.history.map((h, i) => (
                  <li key={`${h.to_status}-${h.created_at}-${i}`} className="border-b border-border py-2">
                    {COPY.status[h.to_status as keyof typeof COPY.status] ?? h.to_status} · {formatDate(h.created_at)}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </StoreMain>
  );
}
