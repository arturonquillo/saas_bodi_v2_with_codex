"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BrandMark } from "../BrandMark";
import { useCart } from "../cart";
import { COPY } from "../copy";
import { SkipLink } from "../layout";
import { useSession } from "../session";
import { useTenantTheme } from "../theme/TenantTheme";

function cartCountLabel(count: number) {
  return count === 1 ? COPY.store.cart_item_one : COPY.store.cart_itens(count);
}

function navClass(active: boolean) {
  return cn(
    active && "font-semibold underline decoration-2 underline-offset-4 decoration-primary",
  );
}

export function StoreChrome({ children }: { children: React.ReactNode }) {
  const { status, session, logout } = useSession();
  const { count } = useCart();
  const { tokens } = useTenantTheme();
  const pathname = usePathname();
  const router = useRouter();
  const loggedIn = status === "auth" && !!session;
  const marca = tokens?.marca ?? "Norte Atacado";
  const countLabel = cartCountLabel(count);
  const authFullBleed = pathname === "/loja/entrar" || pathname === "/loja/cadastro";

  async function onLogout() {
    await logout();
    router.push("/loja");
  }

  const entrarHref = `/loja/entrar${pathname && pathname !== "/loja/entrar" ? `?return=${encodeURIComponent(pathname)}` : ""}`;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <div className="flex h-9 items-center bg-[var(--color-background)] px-4 text-[13px] font-semibold text-foreground md:px-6">
        {marca}
      </div>
      <header className="sticky top-0 z-12 flex min-h-14 flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-border bg-card px-4 md:min-h-16 md:px-6">
        <BrandMark href="/loja" className="text-lg text-foreground md:text-xl" />
        <nav aria-label="Loja" className="flex flex-wrap items-center gap-5">
          <Button variant="ghost" asChild className={cn("min-h-11", navClass(pathname === "/loja"))}>
            <Link href="/loja">{COPY.store.nav_catalogo}</Link>
          </Button>
          {loggedIn ? (
            <Button
              variant="ghost"
              asChild
              className={cn("min-h-11", navClass(pathname.startsWith("/loja/pedidos")))}
            >
              <Link href="/loja/pedidos">{COPY.store.nav_pedidos}</Link>
            </Button>
          ) : null}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            asChild
            className={cn("min-h-11 gap-2", navClass(pathname.startsWith("/loja/carrinho")))}
          >
            <Link href="/loja/carrinho" aria-label={`${COPY.store.nav_carrinho} ${countLabel}`}>
              <ShoppingCart className="size-4" aria-hidden />
              {COPY.store.nav_carrinho}
              <Badge variant="secondary">{countLabel}</Badge>
            </Link>
          </Button>
          {loggedIn ? (
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => void onLogout()}>
              {COPY.actions.sair}
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="min-h-11">
                <Link href={entrarHref}>{COPY.actions.entrar}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/loja/cadastro">{COPY.actions.cadastrar}</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      {children}
      {authFullBleed ? null : (
        <footer className="mt-auto bg-[#2c2d33] px-4 py-8 text-[#f0f0f1] md:px-6 md:py-10">
          <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-3">
            <div>
              <p className="m-0 text-base font-semibold text-white">{marca}</p>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-white">{COPY.store.footer_col_loja}</h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li>
                  <Button variant="link" asChild className="h-auto p-0 text-white">
                    <Link href="/loja">{COPY.store.nav_catalogo}</Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="h-auto p-0 text-white">
                    <Link href="/loja/carrinho">{COPY.store.nav_carrinho}</Link>
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-white">{COPY.store.footer_col_conta}</h2>
              <Separator className="mb-3 hidden bg-white/10" />
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {loggedIn ? (
                  <>
                    <li>
                      <Button variant="link" asChild className="h-auto p-0 text-white">
                        <Link href="/loja/pedidos">{COPY.store.nav_pedidos}</Link>
                      </Button>
                    </li>
                    <li>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-white"
                        onClick={() => void onLogout()}
                      >
                        {COPY.actions.sair}
                      </Button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Button variant="link" asChild className="h-auto p-0 text-white">
                        <Link href={entrarHref}>{COPY.actions.entrar}</Link>
                      </Button>
                    </li>
                    <li>
                      <Button variant="link" asChild className="h-auto p-0 text-white">
                        <Link href="/loja/cadastro">{COPY.actions.cadastrar}</Link>
                      </Button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
