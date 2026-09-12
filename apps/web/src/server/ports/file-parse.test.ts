import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { inventoryFileParsePort } from "./file-parse";

describe("inventory file parse", () => {
  it("maps CSV header synonyms", async () => {
    const csv = "código;produto;qtd\nABC;Peça;4\n";
    const parsed = await inventoryFileParsePort.parse({
      bytes: new TextEncoder().encode(csv),
      filename: "a.csv",
    });
    expect(parsed.rows[0]).toMatchObject({ sku: "ABC", nome: "Peça", quantidade: 4 });
  });

  it("treats dotted 59.90 as R$ 59,90 (5990 centavos), not thousands", async () => {
    const csv = "sku,nome,quantidade,preco_varejo,preco_atacado\nABC,Peça,1,59.90,39.90\n";
    const parsed = await inventoryFileParsePort.parse({
      bytes: new TextEncoder().encode(csv),
      filename: "preco.csv",
    });
    expect(parsed.rows[0]).toMatchObject({
      sku: "ABC",
      preco_varejo_centavos: 5990,
      preco_atacado_centavos: 3990,
    });
  });

  it("treats Brazilian 59,90 and 1.234,56 as reais", async () => {
    const csv = "sku;nome;quantidade;preco_varejo;preco_atacado\nABC;Peça;1;59,90;1.234,56\n";
    const parsed = await inventoryFileParsePort.parse({
      bytes: new TextEncoder().encode(csv),
      filename: "preco-br.csv",
    });
    expect(parsed.rows[0]).toMatchObject({
      sku: "ABC",
      preco_varejo_centavos: 5990,
      preco_atacado_centavos: 123456,
    });
  });

  it("parses the first XLSX sheet", async () => {
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["sku", "nome", "quantidade"],
      ["XYZ", "Item", 9],
    ]);
    XLSX.utils.book_append_sheet(wb, sheet, "Estoque");
    const bytes = new Uint8Array(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
    const parsed = await inventoryFileParsePort.parse({ bytes, filename: "a.xlsx" });
    expect(parsed.rows[0]).toMatchObject({ sku: "XYZ", nome: "Item", quantidade: 9 });
  });
});
