/** Tenant-editable slots. Names match docs/design/tokens.md */
export type ThemeTokens = {
  marca: string;
  primary: string;
  accent: string;
  background: string;
  logo_url: string | null;
};

export const THEME_CSS_VARS = {
  marca: "--marca",
  primary: "--color-primary",
  accent: "--color-accent",
  background: "--color-background",
  logo_url: "--logo-url",
} as const;

export const SEED_THEME: ThemeTokens = {
  marca: "Norte Atacado",
  primary: "#0F4F3E",
  accent: "#C2410C",
  background: "#F6EFE3",
  logo_url: null,
};
