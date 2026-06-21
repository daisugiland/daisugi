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
  const source = value as Record<string, unknown>;
  const keys = Object.keys(source);
  // Nothing to reorder for empty or single-key objects; skip the copy.
  if (keys.length < 2) {
    return value;
  }
  // Object literals are commonly written in sorted order already
  // (`{ a, b, c }`); a cheap scan avoids the sort and the full-object rebuild
  // allocation in that common case.
  let sortedAlready = true;
  for (let i = 1; i < keys.length; i++) {
    if ((keys[i - 1] as string) > (keys[i] as string)) {
      sortedAlready = false;
      break;
    }
  }
  if (sortedAlready) {
    return value;
  }
  keys.sort();
  const sorted: Record<string, unknown> = {};
  for (const key of keys) {
    sorted[key] = source[key];
  }
  return sorted;
}

function hasObjectArg(args: unknown[]): boolean {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    // Any array or object arg (including values with a `toJSON`, e.g. Date)
    // must route through the sorting replacer for deterministic key ordering.
    // Only an all-primitive arg list can safely skip it.
    if (arg !== null && typeof arg === 'object') {
      return true;
    }
  }
  return false;
}

export function stringifyArgs(args: unknown[]): string {
  // A single coerced primitive becomes a bare token (`5`, `true`, `null`)
  // that cannot collide with the bracketed JSON of any other call shape.
  if (args.length === 1 && usesStringCoercion(args[0])) {
    return String(args[0]);
  }
  // The `sortObjectKeys` replacer is only needed when an object/array is present,
  // and it disables V8's fast JSON path. So for the common all-primitive arg list
  // (already deterministic ordering) serialize without it.
  if (!hasObjectArg(args)) {
    return JSON.stringify(args);
  }
  // Serialize the whole args array, so a single array argument
  // (`fn([5, 5])` -> "[[5,5]]") stays distinct from multiple arguments
  // (`fn(5, 5)` -> "[5,5]").
  return JSON.stringify(args, sortObjectKeys);
}
