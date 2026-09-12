"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  customerId,
  customerLabel,
  isApiError,
  normalizeOrder,
  skuCode,
  type CustomerPickDto,
  type EstoqueItemDto,
} from "../api";
import { COPY } from "../copy";
import { formatMoney, maskTaxId } from "../format";
import { DeskWrap, FormWrap, ListHeader, QtyStepper, SaasMain } from "../layout";
import { ChannelChip } from "../order-ui";
import { useSession, writesOpen } from "../session";
import { ErrorState, FormSkeleton } from "../states";

type DraftLine = { sku_id: string; qty: number };

export function NovoPedidoScreen() {
  const { session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerPickDto[] | null>(null);
  const [skus, setSkus] = useState<EstoqueItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [customerIdValue, setCustomerIdValue] = useState("");
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [skuPick, setSkuPick] = useState("");
  const [qty, setQty] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const allowed = writesOpen(session);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, s] = await Promise.all([apiGet<unknown>("/api/saas/clientes"), apiGet<unknown>("/api/saas/estoque")]);
      setCustomers(asPage<CustomerPickDto>(c).items);
      setSkus(asPage<EstoqueItemDto>(s).items);
    } catch (err) {
      setCustomers(null);
      setSkus(null);
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, []);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  const selected = customers?.find((c) => customerId(c) === customerIdValue);
  const list = selected?.document_type === "cnpj" ? "atacado" : "varejo";
  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const nome = customerLabel(c).toLowerCase();
      const masked = (c.document_masked ?? "").toLowerCase();
      return nome.includes(q) || masked.includes(q);
    });
  }, [customers, query]);

  function addLine() {
    if (!skuPick) return;
    const sku = skus?.find((s) => s.id === skuPick);
    const min = list === "atacado" ? Math.max(1, sku?.qtd_min_atacado ?? 1) : 1;
    const nextQty = Math.max(min, qty);
    setLines((prev) => {
      const existing = prev.find((l) => l.sku_id === skuPick);
      if (existing) return prev.map((l) => (l.sku_id === skuPick ? { ...l, qty: l.qty + nextQty } : l));
      return [...prev, { sku_id: skuPick, qty: nextQty }];
    });
  }

  const moqBlocked = lines.some((line) => {
    const sku = skus?.find((s) => s.id === line.sku_id);
    return list === "atacado" && line.qty < (sku?.qtd_min_atacado ?? 1);
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!customerIdValue || !lines.length || moqBlocked) {
      setSubmitError(COPY.errors.save_error);
      return;
    }
    setBusy(true);
    try {
      const created = await apiSend<Parameters<typeof normalizeOrder>[0]>("/api/saas/pedidos", "POST", {
        customer_user_id: customerIdValue,
        linhas: lines.map((l) => ({ sku_id: l.sku_id, qty: l.qty })),
      });
      router.push(`/saas/pedidos/${normalizeOrder(created).id}`);
    } catch (err) {
      setSubmitError(isApiError(err) ? err.message : COPY.errors.save_error);
      setBusy(false);
    }
  }

  if (error) {
    return (
      <SaasMain>
        <ErrorState message={error} onRetry={() => void load()} />
      </SaasMain>
    );
  }

  if (!customers || !skus) {
    return (
      <SaasMain>
        <FormSkeleton />
      </SaasMain>
    );
  }

  return (
    <SaasMain>
      <form className="space-y-4" onSubmit={(e) => void submit(e)}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/saas/pedidos">{COPY.saas.nav.pedidos}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{COPY.saas.novo_pedido}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <ListHeader
          title={COPY.saas.novo_pedido}
          subtitle={COPY.saas.sub_novo}
          actions={
            <Button type="submit" disabled={!allowed || busy || !customerIdValue || !lines.length || moqBlocked}>
              {COPY.saas.criar_pedido}
            </Button>
          }
        />
        {!allowed ? <p className="m-0 text-xs text-muted-foreground">{COPY.entitlement.saas_ro_inadimplente}</p> : null}
        {submitError ? <FieldError>{submitError}</FieldError> : null}
        <FormWrap className="space-y-5">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{COPY.saas.customer}</h2>
            <Separator />
            <Field>
              <FieldLabel>{COPY.saas.buscar_cliente}</FieldLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Input
                    value={
                      selected
                        ? `${customerLabel(selected)} · ${selected.document_masked ?? maskTaxId(selected.document_type, selected.document_last4) ?? ""}`
                        : query
                    }
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCustomerIdValue("");
                      setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                  <ScrollArea className="h-48">
                    {filtered.map((c) => (
                      <Button
                        key={customerId(c)}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setCustomerIdValue(customerId(c));
                          setQuery("");
                          setOpen(false);
                        }}
                      >
                        {customerLabel(c)} · {c.document_masked ?? maskTaxId(c.document_type, c.document_last4) ?? ""}
                      </Button>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </Field>
            {selected ? <ChannelChip list={list} /> : null}
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{COPY.saas.section_items}</h2>
            <Separator />
            <div className="flex flex-wrap items-end gap-2">
              <Field className="min-w-[220px] flex-1">
                <FieldLabel>{COPY.saas.col_sku}</FieldLabel>
                <Select value={skuPick || undefined} onValueChange={setSkuPick}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={COPY.saas.col_sku} />
                  </SelectTrigger>
                  <SelectContent>
                    {skus.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {skuCode(s)} · {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <QtyStepper value={qty} min={1} onChange={setQty} surface="saas" />
              <Button type="button" variant="outline" onClick={addLine}>
                {COPY.saas.add_line}
              </Button>
            </div>
            {lines.length > 0 ? (
              <DeskWrap>
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
                    {lines.map((line) => {
                      const sku = skus.find((s) => s.id === line.sku_id);
                      const unit =
                        list === "atacado" ? (sku?.preco_atacado_centavos ?? 0) : (sku?.preco_varejo_centavos ?? 0);
                      const moq = sku?.qtd_min_atacado ?? 1;
                      const moqFail = list === "atacado" && line.qty < moq;
                      return (
                        <TableRow key={line.sku_id}>
                          <TableCell className="font-semibold">{sku?.nome ?? line.sku_id}</TableCell>
                          <TableCell className="tabular-nums">{line.qty}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(unit)}</TableCell>
                          <TableCell>
                            <ChannelChip list={list} moq={list === "atacado" ? moq : undefined} />
                            {moqFail ? <FieldError>{COPY.store.moq_error(moq)}</FieldError> : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </DeskWrap>
            ) : null}
          </section>
        </FormWrap>
      </form>
    </SaasMain>
  );
}
