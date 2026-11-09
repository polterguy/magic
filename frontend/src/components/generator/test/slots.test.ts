/*
 * Unit tests for the Sandbox API generator's slot helpers — how slot lines are
 * parsed, merged, pinned to a folder, and linted for unpinned risky grants.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import {
  FILE_CHANGING_SLOTS,
  FILE_SLOTS,
  fileSystemPin,
  FOLDER_KIND_SLOTS,
  linesToSlots,
  lintSlotLines,
  mergeSlots,
  refusedSlots,
  ruleIsIncomplete,
  UNPINNED_RISK_SLOTS,
} from '../slots';
import { RoleRule } from '../types';

function rule(overrides: Partial<RoleRule>): RoleRule {
  return {
    id: 'rule',
    role: '',
    limit: '',
    window: '',
    timeout: '',
    slots: '',
    description: '',
    ...overrides,
  };
}

describe('linesToSlots', () => {
  it('trims every line and drops blank ones', () => {
    expect(linesToSlots('  add\n\n  math.add  \n\t\nreturn\n')).toEqual([
      'add',
      'math.add',
      'return',
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(linesToSlots('')).toEqual([]);
    expect(linesToSlots('\n \n')).toEqual([]);
  });

  it('splits on \\n only, so a \\r stays part of nothing but is trimmed away', () => {
    expect(linesToSlots('add\r\nreturn\r\n')).toEqual(['add', 'return']);
  });
});

describe('ruleIsIncomplete', () => {
  it('is true for a rule with slots but no role', () => {
    expect(ruleIsIncomplete(rule({ slots: 'data.read' }))).toBe(true);
    expect(ruleIsIncomplete(rule({ role: '   ', slots: 'data.read' }))).toBe(true);
  });

  it('is false once the rule has a role, or has no slots', () => {
    expect(ruleIsIncomplete(rule({ role: 'admin', slots: 'data.read' }))).toBe(false);
    expect(ruleIsIncomplete(rule({ slots: '  \n ' }))).toBe(false);
  });

  it('ignores limit, window and timeout overrides', () => {
    expect(ruleIsIncomplete(rule({ limit: '10', window: '60', timeout: '2000' }))).toBe(false);
  });
});

describe('mergeSlots', () => {
  it('appends new lines, ending in a newline', () => {
    expect(mergeSlots('', ['data.read'])).toBe('data.read\n');
    expect(mergeSlots('add', ['data.read', 'data.create'])).toBe('add\ndata.read\ndata.create\n');
  });

  it('skips lines that are already present, comparing trimmed lines', () => {
    expect(mergeSlots('  add  \nreturn', ['add', 'math.add'])).toBe('  add  \nreturn\nmath.add\n');
  });

  it('returns the text untouched when there is nothing new', () => {
    const existing = 'add\n\n\nreturn   ';
    expect(mergeSlots(existing, ['return', 'add'])).toBe(existing);
    expect(mergeSlots(existing, [])).toBe(existing);
  });

  it('collapses trailing blank lines before appending', () => {
    expect(mergeSlots('add\n\n\n', ['return'])).toBe('add\nreturn\n');
  });

  it('treats whitespace-only text as empty', () => {
    expect(mergeSlots('  \n', ['add'])).toBe('add\n');
  });

  it('does not dedupe repeated lines within the additions themselves', () => {
    // Today's behaviour: only lines already in the editor are skipped.
    expect(mergeSlots('', ['add', 'add'])).toBe('add\nadd\n');
  });
});

describe('fileSystemPin', () => {
  it('leaves the slot unpinned when no folder is given', () => {
    expect(fileSystemPin('io.file.load', '', 'conf')).toBe('io.file.load');
    expect(fileSystemPin('io.folder.list', '', '')).toBe('io.folder.list');
  });

  it('pins folder-kind slots to the folder itself, adding the trailing slash', () => {
    expect(fileSystemPin('io.folder.list', '/etc/data', '')).toBe('io.folder.list:/etc/data/');
    expect(fileSystemPin('io.file.list', '/etc/data/', 'conf')).toBe('io.file.list:/etc/data/');
  });

  it('pins file-kind slots to any file directly inside the folder', () => {
    expect(fileSystemPin('io.file.load', '/etc/data', '')).toBe('io.file.load:/etc/data/*');
    expect(fileSystemPin('io.file.load', '/etc/data/', '  ')).toBe('io.file.load:/etc/data/*');
  });

  it('narrows file-kind slots to an extension, with or without its leading dots', () => {
    expect(fileSystemPin('io.file.load', '/etc/', 'conf')).toBe('io.file.load:/etc/*.conf');
    expect(fileSystemPin('io.file.load', '/etc/', '.conf')).toBe('io.file.load:/etc/*.conf');
    expect(fileSystemPin('io.file.load', '/etc/', ' ..conf ')).toBe('io.file.load:/etc/*.conf');
  });

  it('does not trim the folder itself — the wizard trims it before calling', () => {
    expect(fileSystemPin('io.folder.list', ' /etc', '')).toBe('io.folder.list: /etc/');
  });

  it('pins every slot one way or the other', () => {
    for (const slot of FILE_SLOTS.read) {
      const pinned = fileSystemPin(slot, '/x', '');
      expect(pinned).toBe(slot + (FOLDER_KIND_SLOTS.has(slot) ? ':/x/' : ':/x/*'));
    }
  });
});

describe('lintSlotLines', () => {
  it('warns about each unpinned risky slot', () => {
    const warnings = lintSlotLines('execute\nmath.add\ndata.connect\nio.file.load');
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toContain('"execute" has no pinned argument');
    expect(warnings[0]).toContain('Pin it, e.g. "execute:the-one-thing".');
    expect(warnings[1]).toContain('"data.connect"');
    expect(warnings[2]).toContain('"io.file.load"');
  });

  it('treats an empty or blank pin as unpinned', () => {
    expect(lintSlotLines('data.connect:')).toHaveLength(1);
    expect(lintSlotLines('data.connect:   ')).toHaveLength(1);
  });

  it('accepts pinned risky slots, and anything that is not risky', () => {
    expect(
      lintSlotLines(
        'data.connect:shop\nexecute:my.slot\nio.file.load:/etc/*.conf\nmath.add\nio.path.get-folder',
      ),
    ).toEqual([]);
  });

  it('only splits on the first colon', () => {
    expect(lintSlotLines('signal:a:b')).toEqual([]);
  });

  it('warns once per line, so repeats are reported twice', () => {
    expect(lintSlotLines('signal\nsignal')).toHaveLength(2);
  });

  it('ignores blank text', () => {
    expect(lintSlotLines('')).toEqual([]);
    expect(lintSlotLines('\n  \n')).toEqual([]);
  });

  it('covers every file and folder slot the files wizard can grant', () => {
    for (const slot of FILE_SLOTS.read) {
      expect(UNPINNED_RISK_SLOTS.has(slot)).toBe(true);
    }
  });

  it('refuses a slot that changes the file system, pinned or not', () => {
    const warnings = lintSlotLines(
      'io.file.save\nio.folder.delete:/etc/data/\nio.file.load:/etc/*.conf',
    );
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain('"io.file.save" changes the file system');
    expect(warnings[1]).toContain('"io.folder.delete" changes the file system');
  });
});

describe('refusedSlots', () => {
  it('finds every file-changing slot, with or without a pin', () => {
    expect(
      refusedSlots(
        'io.file.copy\nio.file.delete:/etc/*\nio.file.move\nio.file.patch\nio.file.save.binary\nio.file.unzip\n' +
          'io.folder.copy\nio.folder.create:/etc/x/\nio.folder.move\nio.stream.save-file',
      ),
    ).toEqual([
      'io.file.copy',
      'io.file.delete',
      'io.file.move',
      'io.file.patch',
      'io.file.save.binary',
      'io.file.unzip',
      'io.folder.copy',
      'io.folder.create',
      'io.folder.move',
      'io.stream.save-file',
    ]);
  });

  it('leaves the slots that only read, and anything else, alone', () => {
    expect(
      refusedSlots(
        'io.file.load\nio.file.exists:/etc/*\nio.folder.list\nio.stream.open-file\nmath.add',
      ),
    ).toEqual([]);
    expect(refusedSlots('')).toEqual([]);
  });

  it('keeps no slot a wizard grants on the refused list', () => {
    for (const slot of FILE_SLOTS.read) {
      expect(FILE_CHANGING_SLOTS.has(slot)).toBe(false);
    }
  });
});
