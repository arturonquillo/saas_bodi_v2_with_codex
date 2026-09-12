import { PedidoDetailScreen } from "@/ui/saas/PedidoDetailScreen";

export default async function SaasPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PedidoDetailScreen id={id} />;
}
