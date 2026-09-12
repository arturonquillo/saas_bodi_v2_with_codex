"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { COPY } from "../copy";
import { AUTH_CARD, AuthStage } from "../layout";
import { LoginForm } from "../LoginForm";

export function ContaEntrarScreen() {
  const params = useSearchParams();
  const redirectTo = params.get("return") || "/conta";
  return (
    <AuthStage>
      <Card className={AUTH_CARD}>
        <CardContent className="space-y-4 p-0">
          <CardDescription className="text-[13px]">{COPY.account.auth_kicker}</CardDescription>
          <CardTitle className="text-[22px] font-semibold">{COPY.actions.entrar}</CardTitle>
          <LoginForm surface="conta" redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </AuthStage>
  );
}
