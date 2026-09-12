export const COLOR_MODE_KEY = "sf-color-mode";

export type ColorMode = "light" | "dark" | "system";
export type ResolvedColorMode = "light" | "dark";

export const COLOR_MODES: ColorMode[] = ["light", "dark", "system"];

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredColorMode(): ColorMode {
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_KEY);
    if (isColorMode(stored)) return stored;
  } catch {
    /* private mode */
  }
  return "light";
}

export function persistColorMode(mode: ColorMode) {
  try {
    window.localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch {
    /* private mode */
  }
}

export function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveColorMode(mode: ColorMode): ResolvedColorMode {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

export function applyDocumentColorMode(resolved: ResolvedColorMode) {
  const dark = resolved === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function clearDocumentColorMode() {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
}

/** Runs before paint on /saas so the first frame matches the saved preference. */
export const COLOR_MODE_BOOT_SCRIPT = `(function(){
  try {
    if (location.pathname.indexOf("/saas") !== 0) {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "";
      return;
    }
    var stored = localStorage.getItem("${COLOR_MODE_KEY}") || "light";
    var dark = stored === "dark" || (stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();`;
