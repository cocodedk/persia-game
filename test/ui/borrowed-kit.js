// The trailer cards speak original lines only: none may borrow a well-known line from the films the
// worlds pay homage to. The guarded lines are kept as [length, SHA-256 of the normal form] (upper case,
// runs of white space as one space), so this file quotes none of them. Guarding one more line: add its
// guardOf entry here.
import { createHash } from 'node:crypto';

export const GUARDED = [
  [13, 'a1a15e5d07a5a93ec61afb622fca962c9642dab9a51279f9b61c27f328d0060a'],
  [10, '9c38c9dc3c82c12f59a5c83e3014bde8d36929d04525282dba341d2561b651d2'],
  [15, 'dd485bdc09aa73ea8b8263ee72cf43b0b3cb1cc259ec979080f9f8134435c079'],
  [13, '9400aea96612e7ab35ffc8eb74e1c856130faf15768907714847c3deb036db42'],
  [8, '4d4a2a0d30624ad2b78a95e3dbbf0831f2bc1a4c124632457b113b6d54d99e3f'],
  [8, '6474f5994639f944a561cb193d3cee08b598899e6e851456f2ab568f114c5925'],
  [12, 'f184f9c9103af6dbb03809d8dbd7dda7c83b89f4fdeb486d98ec4634adba771e'],
  [14, '49f800d581881330e2c374def096c647f05efd48bfc53c9a6690dfcadf0e4178'],
  [12, '01a1cb24f58af8b75d41cd537295d390be6376f65fbe0f9112cd6c20da338569'],
  [9, '377fc0e7302a5edab43e81e10c629e6552392d437f30f18e4e8a8fefc7f56c28'],
  [9, 'c98a9f30c1c069aae1b594d852543c67249644de6d4cff0b9e3df4cdd571e491'],
  [12, '3542185b4efb11405bae96a18d7242d14766f00bc798b0d5fbbd0cd9d03e7a5c'],
  [14, 'a041b381ef836d093fc9edda6ade888191814a8f4272085510781e656721715f'],
];

const normal = (text) => text.toUpperCase().replace(/\s+/g, ' ');
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export const guardOf = (lines) => lines.map((line) => [normal(line).length, sha256(normal(line))]);

// The hash of a guarded line that `text` holds anywhere (compared in normal form), or null.
export function borrowedIn(text, guarded = GUARDED) {
  const line = normal(text);
  const hashes = new Set(guarded.map(([, hash]) => hash));
  for (const n of new Set(guarded.map(([len]) => len))) {
    for (let i = 0; i + n <= line.length; i++) {
      const hash = sha256(line.slice(i, i + n));
      if (hashes.has(hash)) return hash;
    }
  }
  return null;
}
