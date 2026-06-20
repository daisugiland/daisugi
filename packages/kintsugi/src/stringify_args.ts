function usesStringCoercion(value: unknown) {
  return (
    value == null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function sortObjectKeys(_key: string, value: unknown) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return value;
  }
  const keys = Object.keys(value);
  // Nothing to reorder for empty or single-key objects; skip the copy.
  if (keys.length < 2) {
    return value;
  }
  keys.sort();
  const source = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of keys) {
    sorted[key] = source[key];
  }
  return sorted;
}

export function stringifyArgs(args: unknown[]): string {
  // A single coerced primitive becomes a bare token (`5`, `true`, `null`)
  // that cannot collide with the bracketed JSON of any other call shape.
  if (args.length === 1 && usesStringCoercion(args[0])) {
    return String(args[0]);
  }
  // Serialize the whole args array, so a single array argument
  // (`fn([5, 5])` -> "[[5,5]]") stays distinct from multiple arguments
  // (`fn(5, 5)` -> "[5,5]").
  return JSON.stringify(args, sortObjectKeys);
}
