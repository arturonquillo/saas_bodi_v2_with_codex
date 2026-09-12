"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  apiSend,
  isApiError,
  normalizeImportAction,
  previewId,
  type ImportPreviewDto,
  type ImportRowDto,
} from "../api";
import { COPY } from "../copy";
import { DeskWrap, ListHeader, SaasMain } from "../layout";
import { useSession, writesOpen } from "../session";
import { EmptyState } from "../states";

type Msg =
  | { kind: "user"; text: string }
  | { kind: "system"; text: string }
  | { kind: "preview"; preview_id: string; rows: ImportRowDto[] };

function actionBadge(action: ReturnType<typeof normalizeImportAction>) {
  if (action === "create") return <Badge variant="outline">{COPY.saas.row_create}</Badge>;
  if (action === "update") return <Badge variant="default">{COPY.saas.row_update}</Badge>;
  return <Badge variant="destructive">{COPY.saas.row_error}</Badge>;
}

export function ChatEstoqueScreen() {
  const { session } = useSession();
  const allowed = writesOpen(session);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File, note: string) {
    setBusy(true);
    setMsgs((m) => [
      ...m,
      ...(note ? [{ kind: "user" as const, text: note }] : []),
      { kind: "user", text: file.name },
      { kind: "system", text: COPY.saas.parsing },
    ]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (note) fd.append("instruction", note);
      const res = await fetch("/api/saas/importacoes", { method: "POST", body: fd, credentials: "include" });
      const json = (await res.json()) as { data?: ImportPreviewDto; error?: { message: string; code?: string } };
      if (!res.ok) {
        const code = json.error?.code;
        const message =
          code === "tipo_arquivo" || code === "arquivo_grande"
            ? COPY.saas.file_unreadable
            : (json.error?.message ?? COPY.saas.file_unreadable);
        setMsgs((m) => [...m.filter((x) => x.kind !== "system" || x.text !== COPY.saas.parsing), { kind: "system", text: message }]);
        return;
      }
      const preview = json.data;
      if (!preview) {
        setMsgs((m) => [
          ...m.filter((x) => x.kind !== "system" || x.text !== COPY.saas.parsing),
          { kind: "system", text: COPY.saas.file_unreadable },
        ]);
        return;
      }
      const id = previewId(preview);
      const rows = preview.rows ?? [];
      setMsgs((m) => [
        ...m.filter((x) => x.kind !== "system" || x.text !== COPY.saas.parsing),
        { kind: "preview", preview_id: id, rows },
      ]);
      setInstruction("");
    } catch (err) {
      setMsgs((m) => [
        ...m.filter((x) => x.kind !== "system" || x.text !== COPY.saas.parsing),
        { kind: "system", text: isApiError(err) ? err.message : COPY.saas.file_unreadable },
      ]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirm(id: string, rows: ImportRowDto[]) {
    const valid = rows.filter((r) => normalizeImportAction(r.action) !== "error");
    if (!valid.length) return;
    setBusy(true);
    try {
      const result = await apiSend<{ applied: number; skipped: number }>(`/api/saas/importacoes/${id}/confirmar`, "POST");
      setMsgs((m) => [
        ...m.filter((x) => !(x.kind === "preview" && x.preview_id === id)),
        { kind: "system", text: COPY.saas.apply_ok(result.applied, result.skipped) },
      ]);
    } catch (err) {
      setMsgs((m) => [...m, { kind: "system", text: isApiError(err) ? err.message : COPY.errors.save_error }]);
    } finally {
      setBusy(false);
    }
  }

  function discard(id: string) {
    setMsgs((m) => [
      ...m.filter((x) => !(x.kind === "preview" && x.preview_id === id)),
      { kind: "system", text: COPY.saas.discarded },
    ]);
  }

  function sendText(e: React.FormEvent) {
    e.preventDefault();
    const text = instruction.trim();
    const file = fileRef.current?.files?.[0];
    if (file) {
      void upload(file, text);
      return;
    }
    if (text) {
      setMsgs((m) => [...m, { kind: "user", text }]);
      setInstruction("");
    }
  }

  return (
    <SaasMain>
      <ListHeader title={COPY.saas.chat_title} subtitle={COPY.saas.sub_chat} />
      <div className="flex min-h-[360px] flex-col rounded-sm border border-border bg-card">
        <ScrollArea className="h-[420px] p-4">
          <div className="flex flex-col gap-3">
            {msgs.length === 0 ? <EmptyState title={COPY.saas.chat_empty} art="warehouse" /> : null}
            {msgs.map((msg, i) => {
              if (msg.kind === "preview") {
                const rows = msg.rows;
                const valid = rows.filter((r) => normalizeImportAction(r.action) !== "error");
                const allBad = rows.length > 0 && valid.length === 0;
                return (
                  <section key={`${msg.preview_id}-${i}`} className="space-y-3">
                    <h2 className="m-0 text-sm font-semibold">{COPY.saas.preview_title}</h2>
                    <p className="m-0 text-xs text-muted-foreground">{COPY.saas.confirm_hint}</p>
                    <DeskWrap>
                      <Table>
                        <TableHeader className="bg-muted [&_tr]:h-10">
                          <TableRow>
                            <TableHead>{COPY.saas.col_row}</TableHead>
                            <TableHead>{COPY.saas.col_action}</TableHead>
                            <TableHead>{COPY.saas.col_sku}</TableHead>
                            <TableHead>{COPY.saas.col_nome}</TableHead>
                            <TableHead className="text-right">{COPY.stock.on_hand}</TableHead>
                            <TableHead>{COPY.saas.col_msg}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&_tr]:h-10">
                          {rows.map((row, ri) => {
                            const action = normalizeImportAction(row.action);
                            return (
                              <TableRow key={ri}>
                                <TableCell className="font-semibold">{row.row_index ?? ri + 1}</TableCell>
                                <TableCell>{actionBadge(action)}</TableCell>
                                <TableCell>{row.sku ?? "—"}</TableCell>
                                <TableCell>{row.nome ?? "—"}</TableCell>
                                <TableCell className="text-right tabular-nums">{row.quantidade ?? "—"}</TableCell>
                                <TableCell>{row.error_message ?? row.error ?? row.message ?? ""}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </DeskWrap>
                    {allBad ? <p className="m-0 text-xs text-muted-foreground">{COPY.saas.confirm_disabled_all_bad}</p> : null}
                    {!allowed ? (
                      <p className="m-0 text-xs text-muted-foreground">{COPY.entitlement.saas_ro_inadimplente}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={!allowed || busy || allBad || !msg.preview_id}
                        onClick={() => void confirm(msg.preview_id, rows)}
                      >
                        {COPY.saas.confirm_apply}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => discard(msg.preview_id)}>
                        {COPY.saas.discard_preview}
                      </Button>
                    </div>
                  </section>
                );
              }
              return (
                <div
                  key={i}
                  className={
                    msg.kind === "user"
                      ? "rounded-md bg-muted px-3 py-2"
                      : "rounded-md border border-border bg-card px-3 py-2"
                  }
                  aria-live={msg.kind === "system" ? "polite" : undefined}
                >
                  {msg.kind === "system" && msg.text !== COPY.saas.parsing ? (
                    <Alert>
                      <AlertDescription>{msg.text}</AlertDescription>
                    </Alert>
                  ) : (
                    msg.text
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <form className="flex flex-col gap-3 border-t border-border p-4" onSubmit={sendText}>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full border-dashed p-8 hover:border-primary/40"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void upload(file, instruction);
            }}
          >
            {COPY.saas.upload}
            <span className="block text-xs font-normal text-muted-foreground">CSV ou XLSX</span>
          </Button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          />
          <label className="text-sm font-medium" htmlFor="chat-instruction">
            {COPY.saas.instruction_ph}
          </label>
          <Textarea
            id="chat-instruction"
            placeholder={COPY.saas.composer_ph}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <Button type="submit" variant="outline" disabled={busy}>
            {COPY.saas.upload}
          </Button>
        </form>
      </div>
    </SaasMain>
  );
}
