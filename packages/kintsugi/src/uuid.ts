import crypto from 'node:crypto';

export function uuid() {
  return crypto.randomUUID();
}
