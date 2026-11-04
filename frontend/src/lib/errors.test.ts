import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { errorMessage, showError } from './errors';
import { setToastListener } from './toast';

describe('errorMessage', () => {
  it('reads the message of an Error', () => {
    expect(errorMessage(new Error('Boom'))).toBe('Boom');
    expect(errorMessage(new ApiError(404, 'Not found'))).toBe('Not found');
  });

  it('passes a string through', () => {
    expect(errorMessage('Plain text')).toBe('Plain text');
  });

  it('falls back for empty messages and anything else', () => {
    expect(errorMessage(new Error(''))).toBe('Something went wrong');
    expect(errorMessage('')).toBe('Something went wrong');
    expect(errorMessage(null)).toBe('Something went wrong');
    expect(errorMessage(undefined)).toBe('Something went wrong');
    expect(errorMessage({ message: 'not an Error' })).toBe('Something went wrong');
    expect(errorMessage(42)).toBe('Something went wrong');
  });

  it('uses a caller-supplied fallback', () => {
    expect(errorMessage(null, 'Could not save')).toBe('Could not save');
    expect(errorMessage(new Error(''), 'Could not save')).toBe('Could not save');
  });
});

describe('showError', () => {
  afterEach(() => {
    setToastListener(null);
  });

  it('shows an error toast with the prefixed message', () => {
    const listener = vi.fn();
    setToastListener(listener);
    showError(new Error('Boom'), 'Saving failed: ');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Saving failed: Boom', isError: true, logId: undefined }),
    );
  });

  it('passes the log id of an ApiError along', () => {
    const listener = vi.fn();
    setToastListener(listener);
    showError(new ApiError(500, 'Server error', 1234));
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Server error', isError: true, logId: 1234 }),
    );
  });

  it('uses the fallback message for unknown errors', () => {
    const listener = vi.fn();
    setToastListener(listener);
    showError({});
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Something went wrong', isError: true }),
    );
  });
});
