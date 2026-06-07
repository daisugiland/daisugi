export function urandom(): string {
  return globalThis.crypto.randomUUID();
}
