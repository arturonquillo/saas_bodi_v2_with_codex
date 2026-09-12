"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, asPage, isApiError, type OutboxDto } from "../api";
import { COPY } from "../copy";
import { formatDate, maskRecipient } from "../format";
import { DeskWrap, ListHeader, SaasMain } from "../layout";
import { OutboxBadge } from "../order-ui";
import { EmptyState, ErrorState, TableSkeleton } from "../states";

export function AvisosScreen() {
  const [items, setItems] = useState<OutboxDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<unknown>("/api/saas/avisos");
      setItems(asPage<OutboxDto>(data).items);
    } catch (err) {
      setItems(null);
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SaasMain>
      <ListHeader title={COPY.saas.outbox_title} subtitle={COPY.saas.sub_avisos} />
      {items === null && !error ? <TableSkeleton rows={8} /> : null}
      {error ? (
        <DeskWrap className="p-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </DeskWrap>
      ) : null}
      {items && items.length === 0 ? (
        <DeskWrap>
          <EmptyState title={COPY.saas.empty_outbox} art="outbox" />
        </DeskWrap>
      ) : null}
      {items && items.length > 0 ? (
        <DeskWrap>
          <Table>
            <TableHeader className="bg-muted/60 [&_tr]:h-11">
              <TableRow>
                <TableHead>{COPY.saas.col_date}</TableHead>
                <TableHead>{COPY.saas.col_channel}</TableHead>
                <TableHead>{COPY.saas.col_dest}</TableHead>
                <TableHead>{COPY.saas.col_template}</TableHead>
                <TableHead>{COPY.saas.col_pedido}</TableHead>
                <TableHead>{COPY.saas.filter_status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:h-12">
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold">{formatDate(row.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {row.channel === "email" ? COPY.outbox.email : COPY.outbox.whatsapp}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.recipient_role === "seller" ? COPY.saas.role.vendedor : "cliente"} · {maskRecipient(row.recipient)}
                  </TableCell>
                  <TableCell>{row.template_key ?? "—"}</TableCell>
                  <TableCell>
                    {row.order_id ? (
                      <Button variant="link" asChild className="h-auto p-0">
                        <Link href={`/saas/pedidos/${row.order_id}`}>{row.order_id}</Link>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <OutboxBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DeskWrap>
      ) : null}
    </SaasMain>
  );
}
