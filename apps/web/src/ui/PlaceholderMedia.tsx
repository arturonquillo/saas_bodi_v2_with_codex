import { cn } from "@/lib/utils";

const SKIP = new Set(["DE", "DA", "DO", "DOS", "DAS", "E"]);

export function productInitials(nome: string): string {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter((word) => word && !SKIP.has(word.toLocaleUpperCase("pt-BR")));
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toLocaleUpperCase("pt-BR");
  }
  const one = parts[0] ?? nome.trim();
  return one.slice(0, 2).toLocaleUpperCase("pt-BR");
}

export function PlaceholderMedia({
  nome,
  variant,
  dimmed,
}: {
  nome: string;
  variant: "card" | "pdp" | "thumb";
  dimmed?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative grid place-items-center overflow-hidden [container-type:inline-size]",
        "bg-[linear-gradient(152deg,var(--primary)_0%,color-mix(in_srgb,var(--brand-accent)_52%,var(--primary))_100%)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(120%_90%_at_0%_0%,color-mix(in_srgb,#fff_8%,transparent),transparent_56%)]",
        variant === "card" && "aspect-square w-full rounded-none",
        variant === "pdp" && "aspect-square w-full min-w-0 rounded-lg",
        variant === "thumb" && "size-12 shrink-0 rounded-[4px]",
        dimmed && "opacity-70",
      )}
    >
      <span
        className={cn(
          "relative font-semibold leading-none tracking-[0.02em] text-primary-foreground",
          variant === "card" && "text-[28cqi]",
          variant === "pdp" && "text-[32cqi]",
          variant === "thumb" && "text-sm",
        )}
      >
        {productInitials(nome)}
      </span>
    </div>
  );
}
