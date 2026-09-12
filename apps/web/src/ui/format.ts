import { maskCnpj, maskCpf, onlyDigits, type DocumentType } from "@saas-frota/shared";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatMoney(centavos: number) {
  return money.format(centavos / 100);
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTime.format(d);
}

export function formatCpfInput(digits: string) {
  const d = onlyDigits(digits).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `${p1}.${p2}`;
  if (d.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

export function formatCnpjInput(digits: string) {
  const d = onlyDigits(digits).slice(0, 14);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  if (d.length <= 2) return p1;
  if (d.length <= 5) return `${p1}.${p2}`;
  if (d.length <= 8) return `${p1}.${p2}.${p3}`;
  if (d.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
  return `${p1}.${p2}.${p3}/${p4}-${p5}`;
}

export function formatTaxInput(type: DocumentType, value: string) {
  return type === "cnpj" ? formatCnpjInput(value) : formatCpfInput(value);
}

export function maskTaxId(type: DocumentType | undefined, value?: string) {
  if (!value) return undefined;
  if (value.includes("*")) return value;
  const digits = onlyDigits(value);
  if (!type) {
    if (digits.length === 11) return maskCpf(digits);
    if (digits.length === 14) return maskCnpj(digits);
    return value;
  }
  return type === "cnpj" ? maskCnpj(digits) : maskCpf(digits);
}

export function maskRecipient(value?: string) {
  if (!value) return "—";
  const digits = onlyDigits(value);
  if (digits.length === 11) return maskCpf(digits);
  if (digits.length === 14) return maskCnpj(digits);
  const at = value.indexOf("@");
  if (at > 0) {
    const local = value.slice(0, at);
    const domain = value.slice(at);
    return `${local[0]}***${domain}`;
  }
  return value;
}

export function firstName(nome: string) {
  return nome.trim().split(/\s+/)[0] || nome;
}
