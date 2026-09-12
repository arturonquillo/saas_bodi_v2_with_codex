import { ProductScreen } from "@/ui/store/ProductScreen";

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductScreen id={id} />;
}
