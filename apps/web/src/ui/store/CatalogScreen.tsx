"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CatalogItemDto } from "@saas-frota/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiGet, asPage, isApiError } from "../api";
import { useCart } from "../cart";
import { COPY } from "../copy";
import { formatMoney } from "../format";
import { StoreMain } from "../layout";
import { ChannelChip } from "../order-ui";
import { PlaceholderMedia } from "../PlaceholderMedia";
import { useSession } from "../session";
import { CatalogSkeleton, EmptyState, ErrorState } from "../states";

function priceList(documentType?: "cpf" | "cnpj") {
  return documentType === "cnpj" ? "atacado" : "varejo";
}

function catalogLede(documentType?: "cpf" | "cnpj") {
  if (documentType === "cnpj") return COPY.store.catalog_lede_atacado;
  if (documentType === "cpf") return COPY.store.catalog_lede_varejo;
  return COPY.store.catalog_lede_guest;
}

function shopShowing(n: number) {
  return n === 1 ? COPY.store.shop_showing_one : COPY.store.shop_showing(n);
}

export function CatalogScreen() {
  const { session } = useSession();
  const list = priceList(session?.document_type);
  const { add } = useCart();
  const [items, setItems] = useState<CatalogItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<unknown>("/api/loja/catalogo?tenant=demo");
      setItems(asPage<CatalogItemDto>(data).items);
    } catch (err) {
      setItems(null);
      setError(isApiError(err) ? err.message : COPY.store.load_error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StoreMain>
      {items && items.length > 0 ? (
        <div className="mb-6">
          <p className="m-0 text-sm text-muted-foreground">{shopShowing(items.length)}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{catalogLede(session?.document_type)}</p>
        </div>
      ) : null}
      {items === null && !error ? <CatalogSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {items && items.length === 0 ? <EmptyState title={COPY.store.empty_catalog} art="catalog" /> : null}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {items.map((item) => {
            const cents = list === "atacado" ? item.preco_atacado_centavos : item.preco_varejo_centavos;
            const blocked = item.sem_estoque || item.available <= 0;
            return (
              <Card
                key={item.id}
                className="gap-0 rounded-lg py-0 shadow-[var(--shadow-card)] ring-border hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:shadow-[var(--shadow-card)]"
              >
                <PlaceholderMedia nome={item.nome} variant="card" dimmed={blocked} />
                <CardContent className="flex flex-1 flex-col gap-2 p-3">
                  <h2 className="m-0 line-clamp-2 text-base font-semibold leading-tight">
                    <Link href={`/loja/produto/${item.id}`} className="text-inherit no-underline">
                      {item.nome}
                    </Link>
                  </h2>
                  <p className="m-0 text-base font-semibold tabular-nums text-primary">{formatMoney(cents)}</p>
                  <p className="m-0 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                    <ChannelChip list={list} moq={list === "atacado" ? item.qtd_min_atacado : undefined} />
                    {blocked ? COPY.stock.sem_estoque : `${item.available} un`}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("mt-auto h-10 w-full border-primary text-primary sm:h-11")}
                    disabled={blocked}
                    onClick={() => {
                      const qty = list === "atacado" ? Math.max(1, item.qtd_min_atacado) : 1;
                      add(item.id, qty);
                      setAdded(item.id);
                    }}
                  >
                    {blocked ? COPY.stock.sem_estoque : COPY.store.add}
                  </Button>
                  {added === item.id ? (
                    <p className="m-0 text-[13px] text-[var(--color-success)]" role="status" aria-live="polite">
                      {COPY.store.added}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </StoreMain>
  );
}
