/*
 * Consistency tests for the Sandbox API generator's static tables — the base
 * vocabulary every caller gets and the capability wizard specifications.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_BASE_SLOTS } from '../baseSlots';
import { linesToSlots, lintSlotLines } from '../slots';
import { IMAGE_OPS, TIER2_WIZARDS } from '../wizardSpecs';

describe('DEFAULT_BASE_SLOTS', () => {
  const slots = linesToSlots(DEFAULT_BASE_SLOTS);

  it('lists each slot once', () => {
    expect(new Set(slots).size).toBe(slots.length);
  });

  it('grants nothing that would need a pin', () => {
    expect(lintSlotLines(DEFAULT_BASE_SLOTS)).toEqual([]);
  });

  it('leaves out the slots its comment says are deliberately absent', () => {
    for (const slot of [
      'while',
      'sleep',
      'yaml2lambda',
      'yaml2json',
      'json2yaml',
      'lambda2yaml',
      'crypto.password.verify',
      'openai.tokenize',
      'data.connect',
      'http.get',
    ]) {
      expect(slots).not.toContain(slot);
    }
  });
});

describe('TIER2_WIZARDS', () => {
  it('only ticks groups by default that the wizard actually has', () => {
    for (const spec of Object.values(TIER2_WIZARDS)) {
      const keys = spec.groups.map(group => group.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const key of spec.defaults) {
        expect(keys).toContain(key);
      }
    }
  });

  it('gives every group at least one slot', () => {
    for (const spec of Object.values(TIER2_WIZARDS)) {
      for (const group of spec.groups) {
        expect(group.slots.length).toBeGreaterThan(0);
      }
    }
  });

  it('never offers ticket minting from the identity wizard', () => {
    const identity = TIER2_WIZARDS.identity.groups.flatMap(group => group.slots);
    expect(identity).not.toContain('auth.ticket.create');
    expect(identity).not.toContain('auth.token.verify');
  });
});

describe('IMAGE_OPS', () => {
  it('has unique keys', () => {
    const keys = IMAGE_OPS.map(op => op.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
