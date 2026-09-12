import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { fail, handleError, ok } from "@/server/http/respond";
import { assertImportFile, createPreview, MAX_IMPORT_BYTES } from "@/server/import/service";

export async function POST(req: Request) {
  try {
    const session = await requireSaasRole("supervisor");
    requireEntitlementAtiva(session);
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_BYTES + 64 * 1024) {
      return fail("arquivo_grande", "Arquivo maior que 2 MB.");
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("validacao", "Envie o arquivo.");
    const filename = file.name || "estoque.csv";
    assertImportFile(filename, file.size, file.type);
    const instruction = typeof form.get("instruction") === "string" ? String(form.get("instruction")) : undefined;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const preview = await createPreview(session, {
      bytes,
      filename,
      instruction,
      mime: file.type,
    });
    return ok(preview, 201);
  } catch (err) {
    return handleError(err);
  }
}
