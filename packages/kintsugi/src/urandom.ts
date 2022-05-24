import crypto from './crypto.js';

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, '0');
}

export function urandom() {
  const array = new Uint8Array(3);
  crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}
