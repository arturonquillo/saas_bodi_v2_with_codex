/** LGPD: never log full CPF/CNPJ. Use last4 only. */
export function taxIdLast4(digits: string) {
  const d = digits.replace(/\D/g, "");
  return `***${d.slice(-4)}`;
}
