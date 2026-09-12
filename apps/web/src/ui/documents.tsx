"use client";

import { useEffect, useState } from "react";
import { isValidTaxId, onlyDigits, type DocumentType } from "@saas-frota/shared";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiSend, isApiError } from "./api";
import { COPY } from "./copy";
import { formatTaxInput } from "./format";

type Config = { aceita_cpf: boolean; aceita_cnpj: boolean };

export function useDocumentType(config: Config | null) {
  const both = !!config?.aceita_cpf && !!config?.aceita_cnpj;
  const only: DocumentType | null = config
    ? config.aceita_cpf && !config.aceita_cnpj
      ? "cpf"
      : !config.aceita_cpf && config.aceita_cnpj
        ? "cnpj"
        : null
    : null;
  const [type, setType] = useState<DocumentType>(only ?? "cpf");
  useEffect(() => {
    if (only) setType(only);
    else if (config?.aceita_cpf) setType("cpf");
    else if (config?.aceita_cnpj) setType("cnpj");
  }, [only, config?.aceita_cpf, config?.aceita_cnpj]);
  return { type, setType, both, ready: !!config };
}

export function DocumentSwitch({
  type,
  both,
  onChange,
}: {
  type: DocumentType;
  both: boolean;
  onChange: (t: DocumentType) => void;
}) {
  if (!both) return null;
  return (
    <Field>
      <FieldLabel>{COPY.doc.switch_hint}</FieldLabel>
      <RadioGroup
        className="flex flex-row gap-4"
        value={type}
        onValueChange={(v) => onChange(v as DocumentType)}
      >
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <RadioGroupItem value="cpf" />
          {COPY.doc.cpf}
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <RadioGroupItem value="cnpj" />
          {COPY.doc.cnpj}
        </label>
      </RadioGroup>
    </Field>
  );
}

export function DocumentInput({
  type,
  value,
  onChange,
  onBlurValid,
  id,
  autoComplete = "on",
  className,
}: {
  type: DocumentType;
  value: string;
  onChange: (digits: string, formatted: string) => void;
  onBlurValid?: (digits: string) => void;
  id?: string;
  autoComplete?: string;
  className?: string;
}) {
  const digits = onlyDigits(value);
  const formatted = formatTaxInput(type, digits);
  return (
    <Input
      id={id}
      className={className}
      inputMode="numeric"
      autoComplete={autoComplete}
      value={formatted}
      onChange={(e) => {
        const next = onlyDigits(e.target.value);
        onChange(next, formatTaxInput(type, next));
      }}
      onBlur={() => {
        if (isValidTaxId(type, digits)) onBlurValid?.(digits);
      }}
      aria-label={type === "cnpj" ? COPY.doc.cnpj : COPY.doc.cpf}
    />
  );
}

export function useCnpjLookup() {
  const [loading, setLoading] = useState(false);
  const [razao, setRazao] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function lookup(cnpj: string) {
    setLoading(true);
    setWarning(null);
    setHint(null);
    try {
      const data = await apiSend<{
        razao_social?: string;
        registro_pendente?: boolean;
        cnpj_registro_pendente?: boolean;
        ok?: boolean;
        aviso?: string;
      }>("/api/identidade/cnpj", "POST", { cnpj });
      if (data.razao_social) {
        setRazao(data.razao_social);
        setHint(COPY.doc.cnpj_filled);
      }
      if (data.registro_pendente || data.cnpj_registro_pendente || data.ok === false) {
        setWarning(data.aviso ?? COPY.doc.cnpj_registry_down);
      }
    } catch (err) {
      if (isApiError(err) && err.code === "checksum_invalido") {
        setWarning(COPY.doc.checksum_invalid);
      } else {
        setWarning(COPY.doc.cnpj_registry_down);
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRazao("");
    setWarning(null);
    setHint(null);
    setLoading(false);
  }

  return { loading, razao, setRazao, warning, hint, lookup, reset };
}
