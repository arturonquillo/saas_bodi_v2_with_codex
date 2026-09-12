export function parsePaging(url: URL) {
  const raw = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.trunc(raw))) : 20;
  const cursor = url.searchParams.get("cursor");
  return { limit, cursor: cursor || null };
}

export function encodeCursor(parts: string[]) {
  return Buffer.from(parts.join("\n"), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null): string[] | null {
  if (!cursor) return null;
  try {
    return Buffer.from(cursor, "base64url").toString("utf8").split("\n");
  } catch {
    return null;
  }
}
