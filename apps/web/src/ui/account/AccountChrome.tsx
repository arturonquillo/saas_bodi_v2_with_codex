"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COPY } from "../copy";
import { SkipLink } from "../layout";
import { useSession } from "../session";

export function AccountChrome({ children }: { children: React.ReactNode }) {
  const { status, session, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const loggedIn = status === "auth" && !!session;

  async function onLogout() {
    await logout();
    router.push("/conta/entrar");
  }

  return (
    <div data-theme="product" data-density="comfortable" className="min-h-dvh bg-background font-sans">
      <SkipLink />
      <header className="flex h-14 items-center justify-between bg-primary px-4 text-primary-foreground md:px-6">
        <strong className="text-sm font-semibold">
          {COPY.account.product} · {COPY.account.title}
        </strong>
        <nav aria-label="Conta" className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "text-primary-foreground hover:bg-white/10",
                  pathname === "/conta" && "underline decoration-2 underline-offset-4",
                )}
              >
                <Link href="/conta">{COPY.account.nav_assinatura}</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10"
                onClick={() => void onLogout()}
              >
                {COPY.actions.sair}
              </Button>
            </>
          ) : (
            <Button variant="ghost" asChild className="text-primary-foreground hover:bg-white/10">
              <Link href="/conta/entrar">{COPY.actions.entrar}</Link>
            </Button>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
