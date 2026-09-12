import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type KpiItem = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  active?: boolean;
  onSelect?: () => void;
};

function kpiGridClass(count: number) {
  if (count <= 2) return "mb-6 grid gap-3 sm:grid-cols-2";
  if (count === 3) return "mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
  return "mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
}

export function KpiStrip({ items, loading }: { items: KpiItem[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className={kpiGridClass(items.length || 4)}>
        {Array.from({ length: items.length || 4 }, (_, i) => (
          <Card key={i} className="rounded-xl py-4 shadow-none">
            <CardContent className="px-5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-3 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={kpiGridClass(items.length)}>
      {items.map((item) => {
        const Icon = item.icon;
        const interactive = Boolean(item.onSelect);
        const className = cn(
          "rounded-xl py-4 text-left shadow-none transition-colors",
          item.active && "ring-1 ring-primary",
          interactive && "hover:bg-muted/40",
        );
        const body = (
          <CardContent className="flex items-start justify-between gap-3 px-5">
            <div>
              <p className="font-heading text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">
                {item.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
          </CardContent>
        );
        if (!interactive) {
          return (
            <Card key={item.id} className={className}>
              {body}
            </Card>
          );
        }
        return (
          <Card key={item.id} className={className}>
            <button type="button" className="block w-full text-left" onClick={item.onSelect} aria-pressed={item.active}>
              {body}
            </button>
          </Card>
        );
      })}
    </div>
  );
}
