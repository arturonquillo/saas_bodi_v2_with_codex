"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { COPY } from "../copy";
import { AUTH_CARD, AuthStage } from "../layout";
import { LoginForm } from "../LoginForm";

export function StoreEntrarScreen() {
  const params = useSearchParams();
  const redirectTo = params.get("return") || "/loja";
  return (
    <AuthStage className="bg-muted">
      <Card className={AUTH_CARD}>
        <CardContent className="space-y-4 p-0">
          <CardDescription className="text-[13px]">{COPY.store.auth_kicker}</CardDescription>
          <CardTitle className="text-[22px] font-semibold">{COPY.actions.entrar}</CardTitle>
          <LoginForm surface="loja" redirectTo={redirectTo} />
          <Button variant="link" asChild className="h-auto px-0">
            <Link href="/loja/cadastro">{COPY.actions.cadastrar}</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthStage>
  );
}
