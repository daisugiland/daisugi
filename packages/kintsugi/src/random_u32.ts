export function randomU32() {
  return (Math.random() * (1 << 31)) >>> 0;
}
