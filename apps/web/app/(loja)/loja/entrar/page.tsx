import { Suspense } from "react";
import { StoreEntrarScreen } from "@/ui/store/EntrarScreen";
import { CardSkeleton } from "@/ui/states";

export default function LojaEntrarPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <StoreEntrarScreen />
    </Suspense>
  );
}
