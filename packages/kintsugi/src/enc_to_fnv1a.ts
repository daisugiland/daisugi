// MIT License
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the Software
// is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const OFFSET_BASIS_32 = 2166136261;

function fnv1aString(string: string) {
  let hash = OFFSET_BASIS_32;
  for (let i = 0; i < string.length; i++) {
    hash ^= string.codePointAt(i)!;
    // 32-bit FNV prime: 2**24 + 2**8 + 0x93 = 16777619
    // Using bitshift for accuracy and performance. Numbers in JS suck.
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  // `>>> 0` masks to an unsigned 32-bit integer; it is NOT interchangeable
  // with `Math.trunc`, which would leave the value unmasked (and possibly
  // out of uint32 range or negative), breaking the FNV-1a contract.
  // oxlint-disable-next-line unicorn/prefer-math-trunc
  return hash >>> 0;
}

function fnv1aBytes(bytes: Uint8Array) {
  let hash = OFFSET_BASIS_32;
  for (let i = 0; i < bytes.length; ) {
    hash ^= bytes[i++]!;
    // 32-bit FNV prime: 2**24 + 2**8 + 0x93 = 16777619
    // Using bitshift for accuracy and performance. Numbers in JS suck.
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  // See note in `fnv1aString`: `>>> 0` is a uint32 mask, not a truncation.
  // oxlint-disable-next-line unicorn/prefer-math-trunc
  return hash >>> 0;
}

export function encToFNV1A(input: Uint8Array | string) {
  if (input instanceof Uint8Array) {
    return fnv1aBytes(input);
  }
  if (typeof input === 'string') {
    return fnv1aString(input);
  }
  throw new Error(
    'Input must be a string or a Uint8Array.',
  );
}
