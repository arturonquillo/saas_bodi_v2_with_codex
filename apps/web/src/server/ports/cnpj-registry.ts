import type { CnpjRegistryPort, CnpjRegistryResult } from "@saas-frota/shared";
import { taxIdLast4 } from "../authz/mask";
import { env } from "../env";

const TIMEOUT_MS = 3000;

async function brasilApiLookup(cnpjDigits: string): Promise<CnpjRegistryResult> {
  const last4 = taxIdLast4(cnpjDigits);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) {
      console.warn("cnpj_registry_unavailable", { last4, status: res.status });
      return { ok: false, reason: "unavailable" };
    }
    const data = (await res.json()) as { razao_social?: string; nome_fantasia?: string };
    const razaoSocial = data.razao_social || data.nome_fantasia;
    if (!razaoSocial) return { ok: false, reason: "not_found" };
    return { ok: true, razaoSocial };
  } catch {
    console.warn("cnpj_registry_unavailable", { last4 });
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

const livePort: CnpjRegistryPort = {
  async lookup(cnpjDigits) {
    if (!env.cnpjRegistryEnabled) return { ok: false, reason: "unavailable" };
    return brasilApiLookup(cnpjDigits);
  },
};

let injected: CnpjRegistryPort | null = null;

export const cnpjRegistryPort: CnpjRegistryPort = {
  lookup(cnpjDigits) {
    return (injected ?? livePort).lookup(cnpjDigits);
  },
};

export function setCnpjRegistryPortForTests(port: CnpjRegistryPort | null) {
  injected = port;
}
