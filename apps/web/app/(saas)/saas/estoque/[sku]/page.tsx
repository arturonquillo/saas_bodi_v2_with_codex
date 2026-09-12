import { SkuScreen } from "@/ui/saas/SkuScreen";

export default async function SkuPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  return <SkuScreen id={sku} />;
}
