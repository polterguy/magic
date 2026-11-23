/*
 * Whether Analyse can work: the model has to fetch the files from the backend, so a
 * backend on this machine rules it out, however its address is written.
 */
import { describe, expect, it } from 'vitest';

import { backendIsLocal, defaultAttachMode } from '../chatUpload';

describe('backendIsLocal', () => {
  it.each([
    'http://localhost:5000',
    'http://localhost',
    'https://localhost:4201/',
    'http://127.0.0.1:5000',
    'http://[::1]:5000',
  ])('treats %s as local', url => {
    expect(backendIsLocal(url)).toBe(true);
  });

  it.each([
    'https://app.ainiro.io',
    'https://hyperlambda.dev/',
    'http://192.168.1.20:5000',
    'https://localhost.example.com',
  ])('treats %s as reachable', url => {
    expect(backendIsLocal(url)).toBe(false);
  });
});

describe('defaultAttachMode', () => {
  it.each(['http://localhost:5000', 'http://127.0.0.1:5000', 'http://[::1]:5000'])(
    'is Upload on %s',
    url => {
      expect(defaultAttachMode(url)).toBe('upload');
    },
  );

  it.each(['https://app.ainiro.io', 'http://192.168.1.20:5000', 'https://localhost.example.com'])(
    'is Analyse on %s',
    url => {
      expect(defaultAttachMode(url)).toBe('analyse');
    },
  );
});
