function usesStringCoercion(value: unknown) {
  return (
    value == null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

// `JSON.stringify` replacer that re-emits object keys in sorted order, so
// that equal objects produce the same key regardless of insertion order
// ({ a, b } and { b, a } serialize identically). Applied recursively by
// `JSON.stringify`; arrays and non-objects pass through unchanged.
function sortObjectKeys(_key: string, value: unknown) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return value;
  }
  const source = value as Record<string, unknown>;
  return Object.keys(source)
    .toSorted()
    .reduce<Record<string, unknown>>((sorted, key) => {
      sorted[key] = source[key];
      return sorted;
    }, {});
}

export function stringifyArgs(args: unknown[]): string {
  if (args.length === 1) {
    return usesStringCoercion(args[0])
      ? String(args[0])
      : JSON.stringify(args[0], sortObjectKeys);
  }
  return JSON.stringify(args, sortObjectKeys);
}
