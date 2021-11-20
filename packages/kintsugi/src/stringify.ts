function isPrimitive(value) {
  return (
    value == null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function stringify(args: any[]) {
  if (args.length === 1) {
    return isPrimitive(args[0])
      ? args[0]
      : JSON.stringify(args[0]);
  }

  return JSON.stringify(args);
}
