import {
  Bell,
  ClipboardList,
  MessageSquare,
  Package,
  Palette,
  Settings,
  Truck,
  Warehouse,
} from "lucide-react";
import type { NavIconName } from "./nav";

const icons = {
  pedidos: ClipboardList,
  estoque: Package,
  chat: MessageSquare,
  tema: Palette,
  config: Settings,
  avisos: Bell,
  fila: Warehouse,
  entregas: Truck,
} as const;

export function NavIcon({ name }: { name: NavIconName }) {
  const Icon = icons[name];
  return <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />;
}
