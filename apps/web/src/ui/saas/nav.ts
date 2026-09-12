import type { SaasRole } from "@saas-frota/shared";
import { COPY } from "../copy";

export type NavIconName =
  | "pedidos"
  | "estoque"
  | "chat"
  | "tema"
  | "config"
  | "avisos"
  | "fila"
  | "entregas";

export type NavGroupId = "ops" | "casa";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  group: NavGroupId;
};

export function saasNav(role: SaasRole | null | undefined): NavItem[] {
  if (role === "supervisor") {
    return [
      { href: "/saas/pedidos", label: COPY.saas.nav.pedidos, icon: "pedidos", group: "ops" },
      { href: "/saas/estoque", label: COPY.saas.nav.estoque, icon: "estoque", group: "ops" },
      { href: "/saas/chat-estoque", label: COPY.saas.nav.chat, icon: "chat", group: "ops" },
      { href: "/saas/tema", label: COPY.saas.nav.tema, icon: "tema", group: "casa" },
      { href: "/saas/configuracao", label: COPY.saas.nav.config, icon: "config", group: "casa" },
      { href: "/saas/avisos", label: COPY.saas.nav.avisos, icon: "avisos", group: "casa" },
    ];
  }
  if (role === "vendedor") {
    return [
      { href: "/saas/pedidos", label: COPY.saas.nav.pedidos, icon: "pedidos", group: "ops" },
      { href: "/saas/estoque", label: COPY.saas.nav.estoque, icon: "estoque", group: "ops" },
      { href: "/saas/avisos", label: COPY.saas.nav.avisos, icon: "avisos", group: "casa" },
    ];
  }
  if (role === "estoquista") {
    return [
      { href: "/saas/pedidos", label: COPY.saas.nav.fila, icon: "fila", group: "ops" },
      { href: "/saas/estoque", label: COPY.saas.nav.estoque, icon: "estoque", group: "ops" },
    ];
  }
  if (role === "entregador") {
    return [{ href: "/saas/pedidos", label: COPY.saas.nav.entregas, icon: "entregas", group: "ops" }];
  }
  return [];
}

export function saasNavSections(role: SaasRole | null | undefined) {
  const items = saasNav(role);
  const ops = items.filter((i) => i.group === "ops");
  const casa = items.filter((i) => i.group === "casa");
  const sections: { id: NavGroupId; label: string; items: NavItem[] }[] = [];
  if (ops.length) sections.push({ id: "ops", label: COPY.saas.nav_group_ops, items: ops });
  if (casa.length) sections.push({ id: "casa", label: COPY.saas.nav_group_casa, items: casa });
  return sections;
}

export function roleHome(_role: SaasRole | null | undefined) {
  return "/saas/pedidos";
}

export function canOpen(role: SaasRole | null | undefined, path: string) {
  if (!role) return path.startsWith("/saas/entrar");
  if (path.startsWith("/saas/entrar")) return true;
  if (path === "/saas" || path.startsWith("/saas/pedidos")) {
    return true;
  }
  if (path.startsWith("/saas/estoque")) return role === "supervisor" || role === "vendedor" || role === "estoquista";
  if (path.startsWith("/saas/avisos")) return role === "supervisor" || role === "vendedor";
  if (path.startsWith("/saas/chat-estoque") || path.startsWith("/saas/tema") || path.startsWith("/saas/configuracao")) {
    return role === "supervisor";
  }
  return false;
}

export function pedidosTitle(role: SaasRole | null | undefined) {
  if (role === "estoquista") return COPY.saas.nav.fila;
  if (role === "entregador") return COPY.saas.nav.entregas;
  return COPY.saas.nav.pedidos;
}

export function emptyPedidos(role: SaasRole | null | undefined) {
  if (role === "estoquista") return COPY.saas.empty_warehouse;
  if (role === "entregador") return COPY.saas.empty_courier;
  return COPY.saas.empty_orders;
}

export function pedidosSubtitle(role: SaasRole | null | undefined) {
  if (role === "estoquista") return COPY.saas.sub_fila;
  if (role === "entregador") return COPY.saas.sub_entregas;
  return COPY.saas.sub_pedidos;
}

export function currentNavItem(pathname: string, role: SaasRole | null | undefined) {
  return saasNav(role).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function currentPageLabel(pathname: string, role: SaasRole | null | undefined) {
  const match = currentNavItem(pathname, role);
  if (match) return match.label;
  if (pathname.startsWith("/saas/estoque")) return COPY.saas.nav.estoque;
  if (pathname.startsWith("/saas/chat-estoque")) return COPY.saas.nav.chat;
  if (pathname.startsWith("/saas/tema")) return COPY.saas.nav.tema;
  if (pathname.startsWith("/saas/configuracao")) return COPY.saas.nav.config;
  if (pathname.startsWith("/saas/avisos")) return COPY.saas.nav.avisos;
  return pedidosTitle(role);
}

export function currentNavGroup(pathname: string, role: SaasRole | null | undefined): NavGroupId {
  const match = currentNavItem(pathname, role);
  if (match) return match.group;
  if (
    pathname.startsWith("/saas/tema") ||
    pathname.startsWith("/saas/configuracao") ||
    pathname.startsWith("/saas/avisos")
  ) {
    return "casa";
  }
  return "ops";
}
