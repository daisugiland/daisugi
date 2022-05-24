export default globalThis.crypto || (
  await import('node:crypto')
).default.webcrypto;
