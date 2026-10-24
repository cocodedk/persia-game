// The pack's entries by what names them, for the tests that look at what the voice says.
import { PACK } from '../../src/data/pack.js';

export const species = (id) => PACK.species.find((s) => s.id === id);
export const number = (n) => PACK.numbers.find((x) => x.n === n);
