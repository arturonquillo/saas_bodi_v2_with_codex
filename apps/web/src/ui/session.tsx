"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SessionDto, Surface } from "@saas-frota/shared";
import { writesAllowed } from "@saas-frota/shared";
import { api, apiSend, isApiError, type SessionDto as Sess } from "./api";

type Status = "loading" | "guest" | "auth";

type SessionCtx = {
  status: Status;
  session: SessionDto | null;
  forbidden: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<SessionCtx>({
  status: "loading",
  session: null,
  forbidden: false,
  refresh: async () => {},
  logout: async () => {},
});

export function useSession() {
  return useContext(Ctx);
}

export function writesOpen(session: SessionDto | null) {
  return !!session && writesAllowed(session.subscription_status);
}

export function SessionProvider({
  surface,
  children,
}: {
  surface: Surface;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Sess | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api<Sess>(`/api/${surface}/sessao`);
      setSession(data);
      setForbidden(false);
      setStatus("auth");
    } catch (err) {
      setSession(null);
      if (isApiError(err) && err.code === "forbidden") {
        setForbidden(true);
        setStatus("guest");
        return;
      }
      setForbidden(false);
      setStatus("guest");
    }
  }, [surface]);

  const logout = useCallback(async () => {
    try {
      await apiSend(`/api/${surface}/logout`, "POST");
    } catch {
      /* still clear locally */
    }
    setSession(null);
    setStatus("guest");
  }, [surface]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ status, session, forbidden, refresh, logout }),
    [status, session, forbidden, refresh, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
