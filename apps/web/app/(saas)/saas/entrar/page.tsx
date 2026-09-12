import { Suspense } from "react";
import { SaasEntrarScreen } from "@/ui/saas/SaasEntrarScreen";
import { CardSkeleton } from "@/ui/states";

export default function SaasEntrarPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <SaasEntrarScreen />
    </Suspense>
  );
}
