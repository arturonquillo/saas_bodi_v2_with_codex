import type { CanonicalImportRow } from "@saas-frota/shared";
import type { ImportRowAction } from "@prisma/client";
import { availableQty } from "@saas-frota/shared";
import { db } from "../db";
import { ApiError } from "../http/respond";
import { requireEntitlementAtiva } from "../authz/gates";
import type { SessionContext } from "../authz/session";
import { newId } from "../ids";
import { inventoryFileParsePort } from "../ports/file-parse";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT = [".csv", ".xlsx", ".xls"];

export function assertImportFile(filename: string, size: number, mime?: string | null) {
  if (size > MAX_IMPORT_BYTES) throw new ApiError("arquivo_grande", "Arquivo maior que 2 MB.");
  const lower = filename.toLowerCase();
  if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
    throw new ApiError("tipo_arquivo", "Envie um arquivo CSV ou XLSX.");
  }
  if (mime) {
    const allowedMime = [
      "text/csv",
      "application/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    if (!allowedMime.includes(mime) && !ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      throw new ApiError("tipo_arquivo", "Envie um arquivo CSV ou XLSX.");
    }
  }
}

type RowPayload = CanonicalImportRow;

function isErrorRow(row: CanonicalImportRow | { error: string; raw: unknown }): row is { error: string; raw: unknown } {
  return "error" in row;
}

export async function createPreview(
  session: SessionContext,
  input: { bytes: Uint8Array; filename: string; instruction?: string; mime?: string | null },
) {
  requireEntitlementAtiva(session);
  assertImportFile(input.filename, input.bytes.byteLength, input.mime);

  const parsed = await inventoryFileParsePort.parse({
    bytes: input.bytes,
    filename: input.filename,
    instruction: input.instruction,
  });

  const existing = await db.sku.findMany({
    where: { tenantId: session.tenantId },
    include: { balance: true },
  });
  const byCodigo = new Map(existing.map((s) => [s.codigo, s]));

  const batchId = newId("imp");
  const rows = parsed.rows.map((row, index) => {
    if (isErrorRow(row)) {
      return {
        rowIndex: index,
        action: "error" as ImportRowAction,
        payload: row.raw,
        error: row.error,
      };
    }
    const current = byCodigo.get(row.sku);
    if (!current) {
      if (!row.nome?.trim()) {
        return {
          rowIndex: index,
          action: "error" as ImportRowAction,
          payload: row,
          error: "Nome obrigatório para criar SKU.",
        };
      }
      return { rowIndex: index, action: "create" as ImportRowAction, payload: row, error: null };
    }
    if (row.quantidade < (current.balance?.reserved ?? 0)) {
      return {
        rowIndex: index,
        action: "error" as ImportRowAction,
        payload: row,
        error: "quantidade menor que o reservado.",
      };
    }
    return { rowIndex: index, action: "update" as ImportRowAction, payload: row, error: null };
  });

  await db.inventoryImportBatch.create({
    data: {
      id: batchId,
      tenantId: session.tenantId,
      createdById: session.userId,
      instructionText: input.instruction ?? null,
      status: "preview",
      fileName: input.filename,
      rows: {
        create: rows.map((r) => ({
          id: newId("imr"),
          tenantId: session.tenantId,
          rowIndex: r.rowIndex,
          action: r.action,
          payloadJson: JSON.stringify(r.payload ?? {}),
          errorMessage: r.error,
        })),
      },
    },
  });

  return getPreview(session, batchId);
}

export async function getPreview(session: SessionContext, batchId: string) {
  const batch = await db.inventoryImportBatch.findFirst({
    where: { id: batchId, tenantId: session.tenantId },
    include: { rows: { orderBy: { rowIndex: "asc" } } },
  });
  if (!batch) throw new ApiError("nao_encontrado", "Não encontrado.");
  return {
    preview_id: batch.id,
    status: batch.status,
    file_name: batch.fileName,
    rows: batch.rows.map((r) => {
      const payload = safeJson(r.payloadJson) as Partial<RowPayload>;
      return {
        row_index: r.rowIndex,
        action: r.action,
        sku: payload.sku,
        nome: payload.nome,
        quantidade: payload.quantidade,
        error: r.errorMessage,
      };
    }),
  };
}

export async function confirmImport(session: SessionContext, batchId: string) {
  requireEntitlementAtiva(session);

  const result = await db.$transaction(async (tx) => {
    const batch = await tx.inventoryImportBatch.findFirst({
      where: { id: batchId, tenantId: session.tenantId },
      include: { rows: { orderBy: { rowIndex: "asc" } } },
    });
    if (!batch) throw new ApiError("nao_encontrado", "Não encontrado.");
    if (batch.status !== "preview") {
      throw new ApiError("conflito", "Esta prévia já foi aplicada ou descartada.");
    }

    let applied = 0;
    const skipped: { row_index: number; error: string }[] = [];

    for (const row of batch.rows) {
      if (row.action === "error") {
        skipped.push({ row_index: row.rowIndex, error: row.errorMessage || "Linha inválida." });
        continue;
      }
      const payload = safeJson(row.payloadJson) as RowPayload;
      if (!payload.sku || payload.quantidade === undefined || payload.quantidade < 0) {
        skipped.push({ row_index: row.rowIndex, error: "Payload inválido." });
        await tx.inventoryImportRow.update({
          where: { id: row.id },
          data: { action: "error", errorMessage: "Payload inválido." },
        });
        continue;
      }

      const existing = await tx.sku.findFirst({
        where: { tenantId: session.tenantId, codigo: payload.sku },
        include: { balance: true },
      });

      if (!existing) {
        if (!payload.nome?.trim()) {
          skipped.push({ row_index: row.rowIndex, error: "Nome obrigatório para criar SKU." });
          continue;
        }
        const skuId = newId("sku");
        await tx.sku.create({
          data: {
            id: skuId,
            tenantId: session.tenantId,
            codigo: payload.sku,
            nome: payload.nome.trim(),
            precoVarejoCentavos: payload.preco_varejo_centavos ?? 0,
            precoAtacadoCentavos: payload.preco_atacado_centavos ?? 0,
            qtdMinAtacado: payload.qtd_min_atacado ?? 1,
            visivelLoja: payload.visivel_loja ?? true,
          },
        });
        await tx.inventoryBalance.create({
          data: {
            skuId,
            tenantId: session.tenantId,
            onHand: payload.quantidade,
            reserved: 0,
          },
        });
        await tx.inventoryMovement.create({
          data: {
            id: newId("mov"),
            tenantId: session.tenantId,
            skuId,
            importBatchId: batch.id,
            type: "import_apply",
            deltaOnHand: payload.quantidade,
            deltaReserved: 0,
            actorUserId: session.userId,
          },
        });
        await tx.inventoryImportRow.update({ where: { id: row.id }, data: { applied: true } });
        applied += 1;
        continue;
      }

      const reserved = existing.balance?.reserved ?? 0;
      if (payload.quantidade < reserved) {
        skipped.push({ row_index: row.rowIndex, error: "quantidade menor que o reservado." });
        await tx.inventoryImportRow.update({
          where: { id: row.id },
          data: { action: "error", errorMessage: "quantidade menor que o reservado." },
        });
        continue;
      }
      const prevOnHand = existing.balance?.onHand ?? 0;
      if (existing.balance) {
        await tx.inventoryBalance.update({
          where: { skuId: existing.id },
          data: { onHand: payload.quantidade },
        });
      } else {
        await tx.inventoryBalance.create({
          data: {
            skuId: existing.id,
            tenantId: session.tenantId,
            onHand: payload.quantidade,
            reserved: 0,
          },
        });
      }
      await tx.sku.update({
        where: { id: existing.id },
        data: {
          ...(payload.nome ? { nome: payload.nome } : {}),
          ...(payload.preco_varejo_centavos !== undefined
            ? { precoVarejoCentavos: payload.preco_varejo_centavos }
            : {}),
          ...(payload.preco_atacado_centavos !== undefined
            ? { precoAtacadoCentavos: payload.preco_atacado_centavos }
            : {}),
          ...(payload.qtd_min_atacado !== undefined ? { qtdMinAtacado: payload.qtd_min_atacado } : {}),
          ...(payload.visivel_loja !== undefined ? { visivelLoja: payload.visivel_loja } : {}),
        },
      });
      await tx.inventoryMovement.create({
        data: {
          id: newId("mov"),
          tenantId: session.tenantId,
          skuId: existing.id,
          importBatchId: batch.id,
          type: "import_apply",
          deltaOnHand: payload.quantidade - prevOnHand,
          deltaReserved: 0,
          actorUserId: session.userId,
        },
      });
      await tx.inventoryImportRow.update({ where: { id: row.id }, data: { applied: true } });
      applied += 1;
      void availableQty(payload.quantidade, reserved);
    }

    await tx.inventoryImportBatch.update({
      where: { id: batch.id },
      data: { status: "applied", appliedAt: new Date() },
    });

    return { applied, skipped };
  });

  return result;
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}
