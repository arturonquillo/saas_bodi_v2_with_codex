import {
  IMPORT_HEADER_SYNONYMS,
  type CanonicalImportRow,
  type InventoryFileParsePort,
} from "@saas-frota/shared";

type ParsedRow = CanonicalImportRow | { error: string; raw: unknown };

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function mapHeader(raw: string): (typeof IMPORT_HEADER_SYNONYMS)[string] | undefined {
  return IMPORT_HEADER_SYNONYMS[normalizeHeader(raw)];
}

function parseBoolean(value: string): boolean | undefined {
  const v = normalizeHeader(value);
  if (["true", "1", "sim", "s", "yes"].includes(v)) return true;
  if (["false", "0", "nao", "n", "no"].includes(v)) return false;
  return undefined;
}

function parseIntLoose(value: string): number | undefined {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

/** Decimal → reais to centavos. Integer → already centavos. */
function parseMoneyToCentavos(value: string): number | undefined {
  const normalized = value.trim().replace(/\s/g, "");
  if (!normalized) return undefined;

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma === -1 && lastDot === -1) {
    const n = Number(normalized);
    if (!Number.isFinite(n)) return undefined;
    return Math.trunc(n);
  }

  // Last separator is the decimal: `59,90` / `1.234,56` (BR) vs `59.90` / `1,234.56` (US/spreadsheet).
  const asReais =
    lastComma > lastDot
      ? Number(normalized.replace(/\./g, "").replace(",", "."))
      : Number(normalized.replace(/,/g, ""));
  if (!Number.isFinite(asReais)) return undefined;
  return Math.round(asReais * 100);
}

function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = input.split("\n")[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (inQuotes && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" && !inQuotes) {
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

function recordsFromGrid(grid: string[][]): ParsedRow[] {
  if (grid.length < 2) return [{ error: "Arquivo sem linhas de dados.", raw: null }];
  const headers = grid[0].map((h) => mapHeader(h));
  if (!headers.some((h) => h === "sku") || !headers.some((h) => h === "quantidade")) {
    return [{ error: "Cabeçalhos obrigatórios ausentes (sku, quantidade).", raw: grid[0] }];
  }

  const out: ParsedRow[] = [];
  for (const cells of grid.slice(1)) {
    const rec: Record<string, string> = {};
    headers.forEach((key, i) => {
      if (!key) return;
      rec[key] = (cells[i] ?? "").trim();
    });
    const sku = rec.sku?.trim();
    if (!sku) {
      out.push({ error: "SKU obrigatório.", raw: rec });
      continue;
    }
    const quantidade = parseIntLoose(rec.quantidade ?? "");
    if (quantidade === undefined || quantidade < 0) {
      out.push({ error: "Quantidade inválida.", raw: rec });
      continue;
    }
    const row: CanonicalImportRow = { sku, quantidade };
    if (rec.nome) row.nome = rec.nome;
    const varejo = rec.preco_varejo ? parseMoneyToCentavos(rec.preco_varejo) : undefined;
    if (varejo !== undefined) row.preco_varejo_centavos = varejo;
    const atacado = rec.preco_atacado ? parseMoneyToCentavos(rec.preco_atacado) : undefined;
    if (atacado !== undefined) row.preco_atacado_centavos = atacado;
    const moq = rec.qtd_min_atacado ? parseIntLoose(rec.qtd_min_atacado) : undefined;
    if (moq !== undefined) row.qtd_min_atacado = moq;
    if (rec.visivel_loja) {
      const flag = parseBoolean(rec.visivel_loja);
      if (flag !== undefined) row.visivel_loja = flag;
    }
    out.push(row);
  }
  return out;
}

async function parseXlsx(bytes: Uint8Array): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(bytes, { type: "array", cellDates: false });
  const name = wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  const grid = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  return grid.map((row) => row.map((cell) => String(cell ?? "")));
}

export const inventoryFileParsePort: InventoryFileParsePort = {
  async parse(input) {
    const filename = input.filename.toLowerCase();
    let grid: string[][];
    if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      grid = await parseXlsx(input.bytes);
    } else {
      grid = parseCsv(new TextDecoder("utf-8").decode(input.bytes));
    }
    return { rows: recordsFromGrid(grid) };
  },
};
