/*
import crypto from './crypto.js';

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, '0');
}

export function urandom() {
  const array = new Uint8Array(3);
  crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}
*/

// TEMP: Borrowed from https://github.com/lukeed/uid/blob/master/src/index.js

let hexIndex = 256;
const hex: string[] = [];
const size = 256;
let buffer: string;
const len = 11;

while (hexIndex--)
  hex[hexIndex] = (hexIndex + 256)
    .toString(16)
    .substring(1);

export function urandom() {
  let index = 0;
  const temp = len || 11;
  if (!buffer || hexIndex + temp > size * 2) {
    for (buffer = '', hexIndex = 0; index < size; index++) {
      buffer += hex[(Math.random() * 256) | 0];
    }
  }
  return buffer.substring(hexIndex, hexIndex++ + temp);
}
