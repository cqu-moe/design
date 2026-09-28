export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export const THEME_KEY = 'cqu-moe-theme';
export function normalizePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
export function resolveTheme(value: ThemePreference, systemDark: boolean): ResolvedTheme {
  return value === 'system' ? (systemDark ? 'dark' : 'light') : value;
}
export function readPreference(): ThemePreference {
  try {
    return normalizePreference(localStorage.getItem(THEME_KEY));
  } catch {
    return 'system';
  }
}
export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}
function initialize(resolve: typeof resolveTheme, normalize: typeof normalizePreference) {
  let value: ThemePreference = 'system';
  try {
    value = normalize(localStorage.getItem('cqu-moe-theme'));
  } catch {
    /* Storage can be disabled. */
  }
  const theme = resolve(value, matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}
export const themeInitScript = `(${initialize.toString()})(${resolveTheme.toString()},${normalizePreference.toString()});`;
