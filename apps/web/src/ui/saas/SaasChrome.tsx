"use client";

import type { SaasRole } from "@saas-frota/shared";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BrandMark } from "../BrandMark";
import { COPY } from "../copy";
import { SkipLink } from "../layout";
import { useSession } from "../session";
import { ColorModeToggle } from "../theme/ColorModeToggle";
import { useTenantTheme } from "../theme/TenantTheme";
import {
  canOpen,
  currentNavGroup,
  currentPageLabel,
  roleHome,
  saasNav,
  saasNavSections,
} from "./nav";
import { NavIcon } from "./NavIcon";

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupLabel(group: "ops" | "casa") {
  return group === "casa" ? COPY.saas.nav_group_casa : COPY.saas.nav_group_ops;
}

function SaasNav({
  pathname,
  role,
  roleLabel,
}: {
  pathname: string;
  role: SaasRole | null | undefined;
  roleLabel: string;
}) {
  const { setOpenMobile, isMobile, state } = useSidebar();
  const { tokens } = useTenantTheme();
  const sections = saasNavSections(role);
  const initial = (tokens?.marca || roleLabel || "S").slice(0, 1).toUpperCase();
  const iconRail = !isMobile && state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="group-data-[collapsible=icon]:px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={tokens?.marca}
              className="gap-2.5 bg-transparent! hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:mx-auto"
            >
              <BrandMark href="/saas/pedidos" layout="sidebar" iconOnly={iconRail} className="text-sidebar-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className={cn("gap-1 px-2", iconRail && "items-center px-1")}>
        {sections.map((section) => (
          <SidebarGroup key={section.id} className="py-1">
            {iconRail ? null : (
              <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={navActive(pathname, item.href)}
                      tooltip={item.label}
                      className="h-9 rounded-lg text-[13.5px] data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <Link href={item.href}>
                        <NavIcon name={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className={cn("p-2", iconRail && "items-center")}>
        {iconRail ? null : <SidebarSeparator className="mx-0 mb-2" />}
        <div className={cn("flex items-center gap-3 overflow-hidden rounded-lg px-1 py-1", iconRail && "justify-center px-0")}>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-foreground"
          >
            {initial}
          </span>
          {iconRail ? null : (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">{roleLabel || tokens?.marca}</p>
              <p className="truncate text-[11px] text-muted-foreground">{tokens?.marca}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function SaasChrome({ children }: { children: React.ReactNode }) {
  const { status, session, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = session?.saas_role;
  const items = saasNav(role);
  const loginPage = pathname === "/saas/entrar";
  const readOnly = session && session.subscription_status !== "ativa";
  const warehouse = role === "estoquista" || role === "entregador";
  const pageLabel = currentPageLabel(pathname, role);
  const crumbGroup = groupLabel(currentNavGroup(pathname, role));
  const roleLabel = role ? COPY.saas.role[role] : "";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest" && !loginPage) {
      router.replace(`/saas/entrar?return=${encodeURIComponent(pathname)}`);
    }
    if (status === "auth" && !canOpen(role, pathname)) {
      router.replace(roleHome(role));
    }
  }, [status, loginPage, pathname, role, router]);

  async function onLogout() {
    await logout();
    router.push("/saas/entrar");
  }

  if (loginPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
      className={cn("min-h-svh", warehouse && "max-md:text-base")}
      data-role={role ?? undefined}
    >
      <SkipLink />
      <SaasNav pathname={pathname} role={role} roleLabel={roleLabel} />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger className="-ml-1 size-8" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">{crumbGroup}</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            {roleLabel ? (
              <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground sm:inline">
                {roleLabel}
              </span>
            ) : null}
            <ColorModeToggle />
            <Button type="button" variant="ghost" size="sm" onClick={() => void onLogout()}>
              {COPY.actions.sair}
            </Button>
          </div>
        </header>
        {readOnly ? (
          <Alert className="rounded-none border-x-0 border-t-0 bg-[var(--color-warning)]/12">
            <AlertDescription>
              {session.subscription_status === "cancelada"
                ? COPY.entitlement.saas_ro_cancelada
                : COPY.entitlement.saas_ro_inadimplente}
            </AlertDescription>
          </Alert>
        ) : null}
        {children}
        {warehouse ? (
          <nav
            aria-label="Fila"
            className="sticky bottom-0 z-8 flex gap-2 border-t border-border bg-card/90 p-3 backdrop-blur md:hidden"
          >
            {items.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Button
                  key={item.href}
                  variant={active ? "secondary" : "ghost"}
                  asChild
                  className="h-12 flex-1"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>
        ) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
