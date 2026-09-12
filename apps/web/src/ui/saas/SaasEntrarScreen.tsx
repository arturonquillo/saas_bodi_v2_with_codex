"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { BrandMark } from "../BrandMark";
import { COPY } from "../copy";
import { AuthStage } from "../layout";
import { LoginForm } from "../LoginForm";
import { ColorModeToggle } from "../theme/ColorModeToggle";

export function SaasEntrarScreen() {
  const params = useSearchParams();
  const redirectTo = params.get("return") || "/saas/pedidos";
  return (
    <AuthStage className="relative">
      <div className="absolute right-4 top-4">
        <ColorModeToggle />
      </div>
      <Card className="w-full max-w-[420px] rounded-2xl p-8 shadow-none">
        <CardContent className="space-y-4 p-0">
          <CardDescription className="text-[13px]">{COPY.saas.auth_kicker}</CardDescription>
          <BrandMark href="/saas/entrar" className="text-lg tracking-tight" />
          <CardTitle className="text-2xl font-semibold tracking-tight">{COPY.actions.entrar}</CardTitle>
          <LoginForm surface="saas" redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </AuthStage>
  );
}
