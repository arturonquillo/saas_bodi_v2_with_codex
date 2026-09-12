"use client";

import { useCallback, useEffect, useState } from "react";
import type { CanalAviso } from "@saas-frota/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { apiGet, apiSend, isApiError, type SaasConfigDto } from "../api";
import { COPY } from "../copy";
import { FormWrap, ListHeader, SaasMain } from "../layout";
import { useSession, writesOpen } from "../session";
import { ErrorState, FormSkeleton } from "../states";

export function ConfigScreen() {
  const { session, status } = useSession();
  const allowed = writesOpen(session);
  const [cfg, setCfg] = useState<SaasConfigDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCfg(await apiGet<SaasConfigDto>("/api/saas/config"));
    } catch (err) {
      setError(isApiError(err) ? err.message : COPY.errors.load_error);
    }
  }, []);

  useEffect(() => {
    if (status === "auth") void load();
  }, [status, load]);

  async function save() {
    if (!cfg) return;
    setSaveError(null);
    try {
      setCfg(
        await apiSend<SaasConfigDto>("/api/saas/config", "PUT", {
          aceita_cpf: cfg.aceita_cpf,
          aceita_cnpj: cfg.aceita_cnpj,
          canais_aviso: cfg.canais_aviso,
        }),
      );
    } catch (err) {
      setSaveError(isApiError(err) ? err.message : COPY.errors.save_error);
    }
  }

  if (error) {
    return (
      <SaasMain>
        <ErrorState message={error} onRetry={() => void load()} />
      </SaasMain>
    );
  }

  if (!cfg) {
    return (
      <SaasMain>
        <FormSkeleton />
      </SaasMain>
    );
  }

  const lastCpf = cfg.aceita_cpf && !cfg.aceita_cnpj;
  const lastCnpj = cfg.aceita_cnpj && !cfg.aceita_cpf;

  return (
    <SaasMain>
      <ListHeader
        title={COPY.saas.config_title}
        subtitle={COPY.saas.sub_config}
        actions={
          <Button type="button" disabled={!allowed} onClick={() => void save()}>
            {COPY.actions.salvar}
          </Button>
        }
      />
      {!allowed ? <p className="mb-3 text-xs text-muted-foreground">{COPY.entitlement.saas_ro_inadimplente}</p> : null}
      {saveError ? <FieldError className="mb-3">{saveError}</FieldError> : null}
      <FormWrap className="flex max-w-md flex-col gap-5">
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>{COPY.saas.aceita_cpf}</FieldLabel>
            <Switch
              checked={cfg.aceita_cpf}
              disabled={!allowed || lastCpf}
              onCheckedChange={(checked) => setCfg({ ...cfg, aceita_cpf: checked })}
            />
          </div>
          {lastCpf ? <FieldDescription>{COPY.saas.last_flag}</FieldDescription> : null}
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>{COPY.saas.aceita_cnpj}</FieldLabel>
            <Switch
              checked={cfg.aceita_cnpj}
              disabled={!allowed || lastCnpj}
              onCheckedChange={(checked) => setCfg({ ...cfg, aceita_cnpj: checked })}
            />
          </div>
          {lastCnpj ? <FieldDescription>{COPY.saas.last_flag}</FieldDescription> : null}
        </Field>
        <Field>
          <FieldLabel>{COPY.saas.canais}</FieldLabel>
          <RadioGroup
            value={cfg.canais_aviso}
            disabled={!allowed}
            onValueChange={(value) => setCfg({ ...cfg, canais_aviso: value as CanalAviso })}
          >
            {(
              [
                ["email", COPY.saas.canal_email],
                ["whatsapp", COPY.saas.canal_whatsapp],
                ["ambos", COPY.saas.canal_ambos],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={value} />
                {label}
              </label>
            ))}
          </RadioGroup>
        </Field>
        <Field>
          <FieldLabel>{COPY.saas.default_seller}</FieldLabel>
          <p className="m-0 text-sm">
            {cfg.default_seller_nome ?? cfg.default_seller_email ?? cfg.default_seller_user_id ?? "—"}
          </p>
        </Field>
      </FormWrap>
    </SaasMain>
  );
}
