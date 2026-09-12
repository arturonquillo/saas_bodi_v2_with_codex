import { StoreOrderDetailScreen } from "@/ui/store/OrderDetailScreen";

export default async function PedidoLojaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoreOrderDetailScreen id={id} />;
}
