"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isValidTaxId } from "@saas-frota/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiGet, apiSend, isApiError, type StoreConfigDto } from "../api";
import { COPY } from "../copy";
import { DocumentInput, DocumentSwitch, useCnpjLookup, useDocumentType } from "../documents";
import { AUTH_CARD, AuthStage, StoreMain } from "../layout";
import { CardSkeleton, ErrorState } from "../states";

export function RegisterScreen() {
  const [config, setConfig] = useState<StoreConfigDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { type, setType, both } = useDocumentType(config);
  const [digits, setDigits] = useState("");
  const [checksumError, setChecksumError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cnpj = useCnpjLookup();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setConfig(await apiGet<StoreConfigDto>("/api/loja/config?tenant=demo"));
    } catch (err) {
      setLoadError(isApiError(err) ? err.message : COPY.store.load_error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDigits("");
    setChecksumError(null);
    cnpj.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!isValidTaxId(type, digits)) {
      setChecksumError(COPY.doc.checksum_invalid);
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/loja/registrar", "POST", {
        email,
        password,
        nome,
        document_type: type,
        document_digits: digits,
        tenant: "demo",
      });
      window.location.href = "/loja";
    } catch (err) {
      setSubmitError(isApiError(err) ? err.message : COPY.errors.save_error);
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <StoreMain className="max-w-[720px]">
        <ErrorState message={loadError} onRetry={() => void load()} />
      </StoreMain>
    );
  }

  if (!config) {
    return (
      <StoreMain className="max-w-[720px]">
        <CardSkeleton />
      </StoreMain>
    );
  }

  return (
    <AuthStage className="bg-muted">
      <Card className={AUTH_CARD}>
        <CardContent className="space-y-4 p-0">
          <CardDescription className="text-[13px]">{COPY.store.auth_kicker}</CardDescription>
          <CardTitle className="text-[22px] font-semibold">{COPY.actions.cadastrar}</CardTitle>
          <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
            <DocumentSwitch type={type} both={both} onChange={setType} />
            <Field data-invalid={!!checksumError}>
              <FieldLabel>{type === "cnpj" ? COPY.doc.cnpj : COPY.doc.cpf}</FieldLabel>
              <DocumentInput
                className="h-11"
                type={type}
                value={digits}
                onChange={(next) => {
                  setDigits(next);
                  setChecksumError(null);
                }}
                onBlurValid={(valid) => {
                  setChecksumError(null);
                  if (type === "cnpj") void cnpj.lookup(valid);
                }}
              />
              {cnpj.loading ? <FieldDescription>{COPY.doc.cnpj_loading}</FieldDescription> : null}
              {cnpj.hint && !cnpj.loading ? <FieldDescription>{cnpj.hint}</FieldDescription> : null}
              {checksumError ? <FieldError>{checksumError}</FieldError> : null}
            </Field>
            {cnpj.warning ? (
              <Alert className="bg-[var(--color-warning)]/12">
                <AlertDescription>{cnpj.warning}</AlertDescription>
              </Alert>
            ) : null}
            {type === "cnpj" ? (
              <Field>
                <FieldLabel>{COPY.doc.razao_social}</FieldLabel>
                <Input className="h-11" value={cnpj.razao} onChange={(e) => cnpj.setRazao(e.target.value)} />
                <FieldDescription>{COPY.doc.cnpj_filled}</FieldDescription>
              </Field>
            ) : null}
            <Field>
              <FieldLabel>{COPY.store.nome}</FieldLabel>
              <Input className="h-11" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
            </Field>
            <Field>
              <FieldLabel>{COPY.store.email}</FieldLabel>
              <Input
                className="h-11"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field>
              <FieldLabel>{COPY.store.password}</FieldLabel>
              <Input
                className="h-11"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </Field>
            {submitError ? <FieldError>{submitError}</FieldError> : null}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {COPY.store.submit_register}
            </Button>
            <Button variant="link" asChild className="h-auto px-0">
              <Link href="/loja/entrar">{COPY.actions.entrar}</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthStage>
  );
}
