"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CatalogItemDto } from "@saas-frota/shared";
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
import { apiGet, isApiError } from "../api";
import { useCart } from "../cart";
import { COPY } from "../copy";
import { QtyStepper, StoreMain } from "../layout";
import { ChannelChip } from "../order-ui";
import { PlaceholderMedia } from "../PlaceholderMedia";
import { useSession } from "../session";
import { CardSkeleton, EmptyState, ErrorState } from "../states";
import { formatMoney } from "../format";

export function ProductScreen({ id }: { id: string }) {
  const { session } = useSession();
  const list = session?.document_type === "cnpj" ? "atacado" : "varejo";
  const { add } = useCart();
  const [item, setItem] = useState<CatalogItemDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setMissing(false);
    try {
      const data = await apiGet<CatalogItemDto>(`/api/loja/produtos/${id}?tenant=demo`);
      setItem(data);
      const min = session?.document_type === "cnpj" ? Math.max(1, data.qtd_min_atacado) : 1;
      setQty(min);
    } catch (err) {
      setItem(null);
      if (isApiError(err) && (err.status === 404 || err.code === "nao_encontrado")) setMissing(true);
      else setError(isApiError(err) ? err.message : COPY.store.load_error);
    }
  }, [id, session?.document_type]);

  useEffect(() => {
    void load();
  }, [load]);

  const min = list === "atacado" && item ? item.qtd_min_atacado : 1;
  const blocked = !item || item.sem_estoque || item.available <= 0;
  const cents = item ? (list === "atacado" ? item.preco_atacado_centavos : item.preco_varejo_centavos) : 0;
  const moqFail = item && list === "atacado" && qty < item.qtd_min_atacado;

  return (
    <StoreMain>
      {item === null && !error && !missing ? <CardSkeleton /> : null}
      {missing ? (
        <EmptyState
          title={COPY.store.pdp_unavailable}
          art="catalog"
          action={
            <Button variant="link" asChild>
              <Link href="/loja">{COPY.store.ver_catalogo}</Link>
            </Button>
          }
        />
      ) : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {item ? (
        <>
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/loja">{COPY.store.breadcrumb_inicio}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/loja">{COPY.store.nav_catalogo}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{item.nome}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,48%)_minmax(0,1fr)] md:gap-8">
            <PlaceholderMedia nome={item.nome} variant="pdp" dimmed={blocked} />
            <div className="space-y-3">
              <h1 className="m-0 text-[26px] font-semibold leading-tight">{item.nome}</h1>
              <p className="m-0 text-[13px] text-muted-foreground">SKU · {item.sku}</p>
              <p className="m-0 flex flex-wrap items-center gap-2">
                <strong className="text-2xl font-semibold tabular-nums text-primary">{formatMoney(cents)}</strong>
                <ChannelChip list={list} moq={list === "atacado" ? item.qtd_min_atacado : undefined} />
              </p>
              <p className="m-0">{blocked ? COPY.stock.sem_estoque : `${COPY.stock.available} ${item.available}`}</p>
              <Field>
                <FieldLabel htmlFor="qty">{COPY.store.qty}</FieldLabel>
                <QtyStepper
                  id="qty"
                  value={qty}
                  min={min}
                  max={item.available || undefined}
                  onChange={setQty}
                  surface="store"
                />
                {moqFail ? <FieldError>{COPY.store.moq_error(item.qtd_min_atacado)}</FieldError> : null}
              </Field>
              <Button
                type="button"
                className="h-11"
                disabled={blocked || !!moqFail}
                onClick={() => {
                  add(item.id, qty);
                  setAdded(true);
                }}
              >
                {blocked ? COPY.stock.sem_estoque : COPY.store.add}
              </Button>
              {added ? (
                <p className="m-0 text-[13px] text-[var(--color-success)]" role="status" aria-live="polite">
                  {COPY.store.added}
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </StoreMain>
  );
}
