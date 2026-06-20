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
  if (args.length === 1) {
    return usesStringCoercion(args[0])
      ? String(args[0])
      : JSON.stringify(args[0], sortObjectKeys);
  }
  return JSON.stringify(args, sortObjectKeys);
}
