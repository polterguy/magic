import { describe, expect, it } from 'vitest';

import { isValidPort } from '../smtp';

describe('isValidPort', () => {
  it('accepts whole numbers from 1 to 65535', () => {
    for (const port of ['1', '25', '465', '587', '65535', ' 587 ']) {
      expect(isValidPort(port)).toBe(true);
    }
  });

  it('refuses an empty field, out-of-range numbers and anything that is not a whole number', () => {
    for (const port of ['', '   ', '0', '65536', '-1', '58.7', '1e3', 'abc', '587a']) {
      expect(isValidPort(port)).toBe(false);
    }
  });
});
