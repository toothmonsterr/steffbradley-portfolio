// Plasmic's color picker sometimes emits undefined/null/"" when the user hasn't
// picked a color, even though defaultValueHint is set. This helper enforces a
// real fallback so the component never renders transparent by accident.
export function colorOrDefault(value: string | undefined | null, fallback: string): string {
  if (value == null) return fallback;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)') return fallback;
  return trimmed;
}
