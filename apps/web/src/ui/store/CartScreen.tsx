"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogItemDto } from "@saas-frota/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, apiSend, asPage, isApiError, normalizeOrder } from "../api";
import { useCart } from "../cart";
import { COPY } from "../copy";
import { formatMoney } from "../format";
import { QtyStepper, StoreMain } from "../layout";
import { ChannelChip } from "../order-ui";
import { PlaceholderMedia } from "../PlaceholderMedia";
import { useSession } from "../session";
import { EmptyState, ErrorState, TableSkeleton } from "../states";

export function CartScreen() {
  const { session, status } = useSession();
  const { lines, setQty, remove, clear } = useCart();
  const router = useRouter();
  const list = session?.document_type === "cnpj" ? "atacado" : "varejo";
  const [catalog, setCatalog] = useState<CatalogItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priceNotice, setPriceNotice] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<unknown>("/api/loja/catalogo?tenant=demo");
      setCatalog(asPage<CatalogItemDto>(data).items);
    } catch (err) {
      setCatalog(null);
      setError(isApiError(err) ? err.message : COPY.store.load_error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!catalog || status !== "auth") return;
    if (session?.document_type === "cnpj") {
      let bumped = false;
      for (const line of lines) {
        const item = catalog.find((i) => i.id === line.sku_id);
        if (item && line.qty < item.qtd_min_atacado) {
          setQty(line.sku_id, item.qtd_min_atacado);
          bumped = true;
        }
      }
      if (bumped) setPriceNotice(true);
    }
    if (session?.document_type) setPriceNotice(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.document_type, catalog]);

  const rows = useMemo(() => {
    if (!catalog) return [];
    return lines.map((line) => {
      const item = catalog.find((i) => i.id === line.sku_id);
      return { line, item };
    });
  }, [catalog, lines]);

  const total = rows.reduce((sum, { line, item }) => {
    if (!item) return sum;
    const unit = list === "atacado" ? item.preco_atacado_centavos : item.preco_varejo_centavos;
    return sum + unit * line.qty;
  }, 0);

  const lineErrors = rows.map(({ line, item }) => {
    if (!item) return COPY.store.pdp_unavailable;
    if (item.sem_estoque || item.available <= 0 || line.qty > item.available) return COPY.stock.sem_estoque;
    if (list === "atacado" && line.qty < item.qtd_min_atacado) return COPY.store.moq_error(item.qtd_min_atacado);
    return null;
  });
  const hasLineError = lineErrors.some(Boolean);
  const entitlement = session?.subscription_status;
  const blockedEntitlement = entitlement === "inadimplente" || entitlement === "cancelada";
  const guest = status !== "auth";

  async function submit() {
    setSubmitError(null);
    setBusy(true);
    try {
      const created = await apiSend<Parameters<typeof normalizeOrder>[0]>("/api/loja/pedidos", "POST", {
        linhas: lines.map((l) => ({ sku_id: l.sku_id, qty: l.qty })),
      });
      const order = normalizeOrder(created);
      clear();
      router.push(`/loja/pedidos/${order.id}`);
    } catch (err) {
      setSubmitError(isApiError(err) ? err.message : COPY.errors.save_error);
      setBusy(false);
    }
  }

  const countLabel =
    lines.length === 0 ? undefined : lines.length === 1 ? COPY.store.cart_item_one : COPY.store.cart_itens(lines.length);

  function lineUnit(item: CatalogItemDto | undefined) {
    if (!item) return 0;
    return list === "atacado" ? item.preco_atacado_centavos : item.preco_varejo_centavos;
  }

  return (
    <StoreMain>
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold">{COPY.store.nav_carrinho}</h1>
        {countLabel ? <p className="mt-1 text-sm text-muted-foreground">{countLabel}</p> : null}
      </header>
      {catalog === null && !error ? <TableSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {catalog && lines.length === 0 ? (
        <EmptyState
          title={COPY.store.empty_cart}
          art="cart"
          action={
            <Button variant="link" asChild>
              <Link href="/loja">{COPY.store.ver_catalogo}</Link>
            </Button>
          }
        />
      ) : null}
      {catalog && lines.length > 0 ? (
        <div className="space-y-4">
          {priceNotice && status === "auth" ? (
            <Alert>
              <AlertDescription>{COPY.store.price_changed}</AlertDescription>
            </Alert>
          ) : null}
          {blockedEntitlement ? (
            <Alert className="bg-[var(--color-warning)]/12">
              <AlertDescription>
                {entitlement === "cancelada"
                  ? COPY.entitlement.store_blocked_cancelada
                  : COPY.entitlement.store_blocked_inadimplente}
              </AlertDescription>
            </Alert>
          ) : null}
          {guest ? (
            <Alert>
              <AlertDescription>{COPY.store.guest_hint}</AlertDescription>
            </Alert>
          ) : null}

          <div className="hidden overflow-x-auto rounded-sm border border-border bg-card md:block">
            <Table>
              <TableHeader className="bg-muted [&_tr]:h-10">
                <TableRow>
                  <TableHead>{COPY.saas.col_nome}</TableHead>
                  <TableHead>{COPY.saas.unit_price}</TableHead>
                  <TableHead>{COPY.store.qty}</TableHead>
                  <TableHead className="text-right">{COPY.saas.col_total}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:h-10">
                {rows.map(({ line, item }, i) => (
                  <TableRow key={line.sku_id}>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-3">
                        <PlaceholderMedia nome={item?.nome ?? line.sku_id} variant="thumb" />
                        {item?.nome ?? line.sku_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {item ? formatMoney(lineUnit(item)) : "—"}
                        <ChannelChip list={list} moq={list === "atacado" ? item?.qtd_min_atacado : undefined} />
                      </div>
                      {lineErrors[i] ? <FieldError>{lineErrors[i]}</FieldError> : null}
                    </TableCell>
                    <TableCell>
                      <QtyStepper
                        value={line.qty}
                        min={1}
                        onChange={(n) => setQty(line.sku_id, n)}
                        surface="store"
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item ? formatMoney(lineUnit(item) * line.qty) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" onClick={() => remove(line.sku_id)} aria-label="Remover">
                        ×
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {rows.map(({ line, item }, i) => (
              <div key={line.sku_id} className="space-y-3 border-b border-border py-4">
                <div className="flex gap-3">
                  <PlaceholderMedia nome={item?.nome ?? line.sku_id} variant="thumb" />
                  <div>
                    <strong>{item?.nome ?? line.sku_id}</strong>
                    <div className="flex flex-wrap items-center gap-2">
                      {item ? formatMoney(lineUnit(item)) : "—"}
                      <ChannelChip list={list} moq={list === "atacado" ? item?.qtd_min_atacado : undefined} />
                    </div>
                    {lineErrors[i] ? <FieldError>{lineErrors[i]}</FieldError> : null}
                  </div>
                </div>
                <QtyStepper value={line.qty} min={1} onChange={(n) => setQty(line.sku_id, n)} surface="store" />
                <p className="m-0 text-right font-semibold tabular-nums">
                  {item ? formatMoney(lineUnit(item) * line.qty) : "—"}
                </p>
                <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => remove(line.sku_id)}>
                  ×
                </Button>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 z-6 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card py-3 md:static md:border-0">
            <p className="m-0 text-xl font-semibold tabular-nums">Total: {formatMoney(total)}</p>
            {submitError ? <FieldError>{submitError}</FieldError> : null}
            {guest ? (
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Button asChild className="h-11 flex-1 sm:flex-none">
                  <Link href="/loja/entrar?return=/loja/carrinho">{COPY.store.entrar_para_pedir}</Link>
                </Button>
                <Button variant="outline" asChild className="h-11 flex-1 sm:flex-none">
                  <Link href="/loja/cadastro">{COPY.actions.cadastrar}</Link>
                </Button>
              </div>
            ) : null}
            {!guest && !blockedEntitlement ? (
              <Button type="button" className="h-11" disabled={busy || hasLineError} onClick={() => void submit()}>
                {COPY.store.finalizar}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </StoreMain>
  );
}
