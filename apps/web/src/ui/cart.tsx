"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { sku_id: string; qty: number };

const KEY = "sf.loja.cart.v1";

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed)
      ? parsed.filter((l) => l && typeof l.sku_id === "string" && Number.isFinite(l.qty) && l.qty > 0)
      : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
}

type CartCtx = {
  lines: CartLine[];
  count: number;
  setQty: (sku_id: string, qty: number) => void;
  add: (sku_id: string, qty: number) => void;
  remove: (sku_id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx>({
  lines: [],
  count: 0,
  setQty: () => {},
  add: () => {},
  remove: () => {},
  clear: () => {},
});

export function useCart() {
  return useContext(Ctx);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(read());
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    write(next);
  }, []);

  const setQty = useCallback(
    (sku_id: string, qty: number) => {
      if (qty <= 0) {
        commit(lines.filter((l) => l.sku_id !== sku_id));
        return;
      }
      const existing = lines.find((l) => l.sku_id === sku_id);
      commit(existing ? lines.map((l) => (l.sku_id === sku_id ? { ...l, qty } : l)) : [...lines, { sku_id, qty }]);
    },
    [commit, lines],
  );

  const add = useCallback(
    (sku_id: string, qty: number) => {
      const existing = lines.find((l) => l.sku_id === sku_id);
      if (existing) commit(lines.map((l) => (l.sku_id === sku_id ? { ...l, qty: l.qty + qty } : l)));
      else commit([...lines, { sku_id, qty }]);
    },
    [commit, lines],
  );

  const remove = useCallback(
    (sku_id: string) => commit(lines.filter((l) => l.sku_id !== sku_id)),
    [commit, lines],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), setQty, add, remove, clear }),
    [lines, setQty, add, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
