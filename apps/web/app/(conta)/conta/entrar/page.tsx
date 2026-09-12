import { Suspense } from "react";
import { ContaEntrarScreen } from "@/ui/account/ContaEntrarScreen";
import { CardSkeleton } from "@/ui/states";

export default function ContaEntrarPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ContaEntrarScreen />
    </Suspense>
  );
}
