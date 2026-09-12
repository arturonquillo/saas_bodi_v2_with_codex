"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { formatDate, formatMoney } from "../format";
import { StoreMain } from "../layout";
import { StatusBadge } from "../order-ui";
import { useSession } from "../session";
import { EmptyState, ErrorState, TableSkeleton } from "../states";

export function OrdersScreen() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ReturnType<typeof normalizeOrder>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<unknown>("/api/loja/pedidos");
      setItems(asPage<OrderDto>(data).items.map(normalizeOrder));
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        router.replace("/loja/entrar?return=/loja/pedidos");
        return;
      }
      setItems(null);
      setError(isApiError(err) ? err.message : COPY.store.load_error);
    }
  }, [router]);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/loja/entrar?return=/loja/pedidos");
      return;
    }
    if (status === "auth") void load();
  }, [status, load, router]);

  return (
    <StoreMain>
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold">{COPY.store.nav_pedidos}</h1>
      </header>
      {(status === "loading" || items === null) && !error ? <TableSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {items && items.length === 0 ? (
        <EmptyState
          title={COPY.store.empty_orders}
          art="pedidos"
          action={
            <Button variant="link" asChild>
              <Link href="/loja">{COPY.store.ver_catalogo}</Link>
            </Button>
          }
        />
      ) : null}
      {items && items.length > 0 ? (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted [&_tr]:h-10">
              <TableRow>
                <TableHead>{COPY.store.pedido_n("")}</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:h-10">
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-semibold">
                    <Link href={`/loja/pedidos/${order.id}`} className="font-semibold text-primary">
                      {COPY.store.pedido_n(order.id)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(order.total_centavos)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </StoreMain>
  );
}
