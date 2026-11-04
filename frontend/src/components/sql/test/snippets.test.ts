/*
 * Unit tests for SQL Studio's snippet file naming.
 */

import { describe, expect, it } from 'vitest';

import { snippetFilename, snippetLabel, snippetSuggestion } from '../snippets';

describe('snippetLabel', () => {
  it('drops the folder', () => {
    expect(snippetLabel('/etc/sqlite/templates/users.sql')).toBe('users.sql');
  });

  it('returns names without a folder unchanged', () => {
    expect(snippetLabel('users.sql')).toBe('users.sql');
  });
});

describe('snippetSuggestion', () => {
  it('is the loaded snippet name without folder and extension', () => {
    expect(snippetSuggestion('/etc/mysql/templates/report.sql')).toBe('report');
  });

  it('is empty when nothing is loaded', () => {
    expect(snippetSuggestion('')).toBe('');
  });
});

describe('snippetFilename', () => {
  it('places the snippet in the type template folder with a .sql extension', () => {
    expect(snippetFilename('sqlite', 'report')).toBe('/etc/sqlite/templates/report.sql');
  });

  it('does not double an existing .sql extension', () => {
    expect(snippetFilename('pgsql', 'report.sql')).toBe('/etc/pgsql/templates/report.sql');
  });
});
