import { NextResponse } from "next/server";
import { HTTP_FOR_CODE, type ApiErrorCode, type ApiOk } from "@saas-frota/shared";

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data } satisfies ApiOk<T>, { status });
}

export function fail(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status: HTTP_FOR_CODE[code] },
  );
}

export function notImplemented(moduleName: string) {
  return fail("nao_implementado", `${moduleName} ainda não foi implementado.`);
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) return fail(err.code, err.message, err.details);
  console.error("api_unhandled", err instanceof Error ? err.message : "unknown");
  return fail("validacao", "Erro inesperado.");
}
