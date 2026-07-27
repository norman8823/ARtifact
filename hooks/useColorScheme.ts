// Force light mode regardless of system settings.
// The return type is annotated rather than inferred: without it TypeScript
// widens the literal to `string`, which then can't index Colors or the
// light/dark props in useThemeColor.
export function useColorScheme(): "light" | "dark" {
  return "light";
}
