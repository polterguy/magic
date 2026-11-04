// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispositionFilename, downloadBlob, exportCsv } from './download';

describe('dispositionFilename', () => {
  it('reads a quoted filename', () => {
    expect(dispositionFilename('attachment; filename="my report.csv"')).toBe('my report.csv');
  });

  it('reads an unquoted filename, stopping at the next parameter', () => {
    expect(dispositionFilename('attachment; filename=report.csv')).toBe('report.csv');
    expect(dispositionFilename('attachment; filename=report.csv ; size=12')).toBe('report.csv');
  });

  it("strips the UTF-8'' prefix of an RFC 5987 filename*", () => {
    expect(dispositionFilename("attachment; filename*=UTF-8''report.zip")).toBe('report.zip');
  });

  it('returns null without a filename', () => {
    expect(dispositionFilename('attachment')).toBeNull();
    expect(dispositionFilename('')).toBeNull();
  });
});

describe('downloads', () => {
  let blobs: Blob[];
  let clicks: { href: string; download: string }[];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    blobs = [];
    clicks = [];
    createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:fake/' + blobs.length;
    });
    revokeObjectURL = vi.fn();
    // jsdom has no object URLs of its own.
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('downloadBlob clicks an anchor at an object URL, then revokes it', () => {
    downloadBlob(new Blob(['x']), 'x.txt');
    expect(clicks).toEqual([{ href: 'blob:fake/1', download: 'x.txt' }]);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake/1');
  });

  it('exportCsv writes a header from the first row and one line per row', async () => {
    exportCsv(
      [
        { id: 1, name: 'a', active: true },
        { id: 2, name: 'b', active: false },
      ],
      'rows.csv',
    );
    expect(clicks).toEqual([{ href: 'blob:fake/1', download: 'rows.csv' }]);
    expect(blobs[0].type).toBe('text/csv');
    expect(await blobs[0].text()).toBe('id,name,active\n1,a,true\n2,b,false');
  });

  it('exportCsv quotes cells holding commas, quotes or newlines', async () => {
    exportCsv([{ a: 'x,y', b: 'say "hi"', c: 'one\ntwo', d: 'plain' }], 'q.csv');
    expect(await blobs[0].text()).toBe('a,b,c,d\n"x,y","say ""hi""","one\ntwo",plain');
  });

  it('exportCsv writes null and undefined as empty cells', async () => {
    exportCsv([{ a: null, b: undefined, c: 0 }], 'n.csv');
    expect(await blobs[0].text()).toBe('a,b,c\n,,0');
  });

  it('exportCsv only writes, and orders by, the columns asked for', async () => {
    exportCsv(
      [
        { id: 1, name: 'a', secret: 's' },
        { id: 2, name: 'b', secret: 't' },
      ],
      'c.csv',
      ['name', 'id', 'missing'],
    );
    expect(await blobs[0].text()).toBe('name,id,missing\na,1,\nb,2,');
  });

  it('exportCsv does nothing for no rows', () => {
    exportCsv([], 'empty.csv');
    expect(clicks).toEqual([]);
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
