import { describe, expect, it } from 'vitest';

import { CANVAS_SANDBOX, liveSandbox } from '../html';

/*
 * The sandboxes are a security boundary, not a preference, and both are one
 * token away from being useless. These tests exist so that removing or adding
 * a token has to be done on purpose, with a failing test to argue with.
 */
describe('designer sandboxes', () => {
  it('never lets the canvas run scripts', () => {
    // The canvas holds untrusted markup AT THE DASHBOARD'S OWN ORIGIN.
    expect(CANVAS_SANDBOX).toBe('allow-same-origin');
    expect(CANVAS_SANDBOX).not.toContain('allow-scripts');
  });

  it('lets Live run the page, but never navigate the dashboard away', () => {
    const sandbox = liveSandbox(false);
    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).toContain('allow-same-origin');
    expect(sandbox).not.toContain('allow-top-navigation');
  });

  it('drops allow-same-origin when the dashboard shares the cloudlet origin', () => {
    // Together the two tokens would hand the page the dashboard's session.
    const sandbox = liveSandbox(true);
    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
    expect(sandbox).not.toContain('allow-top-navigation');
  });
});
