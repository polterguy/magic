/*
 * Unit tests for the warning shown when an edit replaces a server-filled
 * value. The toast is mocked; nothing is rendered.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/toast', () => ({ showToast: vi.fn() }));

import { showToast } from '../../../lib/toast';
import { reportDropped } from '../slotWarning';

beforeEach(() => {
  vi.mocked(showToast).mockClear();
});

describe('reportDropped', () => {
  it('says nothing when no expression went away', () => {
    reportDropped('Hello {{name}}', 'Hi {{name}}');
    reportDropped('Hello', 'Hi');
    expect(showToast).not.toHaveBeenCalled();
  });

  it('says nothing when an expression was renamed rather than removed', () => {
    reportDropped('{{a}}', '{{b}}');
    expect(showToast).not.toHaveBeenCalled();
  });

  it('names one dropped expression, as an error', () => {
    reportDropped('{{title}} by {{author}}', '{{title}} by me');
    expect(showToast).toHaveBeenCalledWith(
      '{{author}} was filled in by the server. Fixed text means the page stops asking — undo ' +
        'if that was not the idea.',
      true,
    );
  });

  it('names several dropped expressions together', () => {
    reportDropped('{{a}} {{b}}', 'fixed');
    expect(vi.mocked(showToast).mock.calls[0][0]).toMatch(
      /^\{\{a\}\} and \{\{b\}\} were filled in/,
    );
  });

  it('says nothing when one of two identical expressions is dropped', () => {
    reportDropped('{{a}} and {{a}}', '{{a}} and me');
    expect(showToast).not.toHaveBeenCalled();
  });
});
