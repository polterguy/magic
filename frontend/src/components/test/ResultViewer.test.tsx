// @vitest-environment jsdom
/*
 * ResultViewer: dispatching on Content-Type — text (pretty-printed JSON, the OK
 * placeholder for an empty body, read errors), the HTML source/preview toggle, images,
 * and file downloads — plus the onText callback and the editor mode it chooses.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from '../../lib/download';
import ResultViewer, { type RawResult } from '../ResultViewer';

vi.mock('../CodeEditor', () => ({
  default: (props: Readonly<{ value: string; mode: string }>) => (
    <pre data-testid="editor" data-mode={props.mode}>
      {props.value}
    </pre>
  ),
}));

vi.mock('../../lib/download', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/download')>()),
  downloadBlob: vi.fn(),
}));

const revokeObjectURL = vi.fn();

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  vi.clearAllMocks();
});

function result(body: string, contentType: string, disposition = ''): RawResult {
  return { blob: new Blob([body]), contentType, disposition, status: 200 };
}

describe('ResultViewer text', () => {
  it('pretty-prints JSON and picks the JSON mode', async () => {
    render(<ResultViewer result={result('{"a":1}', 'application/json; charset=utf-8')} />);
    const editor = await screen.findByTestId('editor');
    expect(editor).toHaveAttribute('data-mode', 'application/json');
    expect(editor.textContent).toBe('{\n  "a": 1\n}');
  });

  it('shows malformed JSON raw', async () => {
    render(<ResultViewer result={result('{not json', 'application/json')} />);
    expect((await screen.findByTestId('editor')).textContent).toBe('{not json');
  });

  it('shows a placeholder for an empty body', async () => {
    render(<ResultViewer result={result('', 'text/plain')} />);
    expect(await screen.findByText('OK — no result')).toBeInTheDocument();
  });

  it.each([
    ['application/xml', 'application/xml'],
    ['text/markdown', 'markdown'],
    ['application/x-hyperlambda', 'hyperlambda'],
    ['text/plain', 'text/plain'],
    ['application/javascript', 'text/plain'],
  ])('uses the %s editor mode %s', async (contentType, mode) => {
    render(<ResultViewer result={result('x', contentType)} />);
    expect(await screen.findByTestId('editor')).toHaveAttribute('data-mode', mode);
  });

  it('reports a read failure as the text', async () => {
    const blob = new Blob(['x']);
    vi.spyOn(blob, 'text').mockRejectedValue(new Error('disk gone'));
    render(
      <ResultViewer result={{ blob, contentType: 'text/plain', disposition: '', status: 200 }} />,
    );
    expect(await screen.findByText(/Could not read the result: disk gone/)).toBeInTheDocument();
  });

  it('hands the displayed text to onText', async () => {
    const onText = vi.fn();
    render(<ResultViewer result={result('hello', 'text/plain')} onText={onText} />);
    await waitFor(() => expect(onText).toHaveBeenCalledWith('hello'));
  });

  it('reports null text for a binary result', async () => {
    const onText = vi.fn();
    render(<ResultViewer result={result('x', 'application/octet-stream')} onText={onText} />);
    await waitFor(() => expect(onText).toHaveBeenCalledWith(null));
  });

  it('applies the given height', async () => {
    const { container } = render(
      <ResultViewer result={result('hello', 'text/plain')} height="200px" />,
    );
    await screen.findByTestId('editor');
    expect(container.firstChild).toHaveStyle({ height: '200px' });
  });
});

describe('ResultViewer html', () => {
  it('toggles between source and a sandboxed preview', async () => {
    render(<ResultViewer result={result('<b>hi</b>', 'text/html')} />);
    expect(await screen.findByTestId('editor')).toHaveAttribute('data-mode', 'htmlmixed');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const frame = screen.getByTitle('Result preview');
    expect(frame).toHaveAttribute('srcdoc', '<b>hi</b>');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Source' }));
    expect(screen.getByTestId('editor')).toBeInTheDocument();
  });

  it('shows no toggle for non-HTML text', async () => {
    render(<ResultViewer result={result('x', 'text/plain')} />);
    await screen.findByTestId('editor');
    expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
  });

  it('returns to source when a new result arrives', async () => {
    const { rerender } = render(<ResultViewer result={result('<i>a</i>', 'text/html')} />);
    await screen.findByTestId('editor');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    rerender(<ResultViewer result={result('<i>b</i>', 'text/html')} />);
    expect(await screen.findByTestId('editor')).toHaveTextContent('<i>b</i>');
  });
});

describe('ResultViewer image and files', () => {
  it('renders an image from an object URL and revokes it on unmount', () => {
    const { unmount } = render(<ResultViewer result={result('png', 'image/png')} />);
    expect(screen.getByAltText('Result')).toHaveAttribute('src', 'blob:mock-url');
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('offers a download for a binary, with name, type and size', async () => {
    const blob = new Blob([new Uint8Array(2048)]);
    render(
      <ResultViewer
        result={{
          blob,
          contentType: 'application/pdf',
          disposition: 'inline; filename="report.pdf"',
          status: 200,
        }}
      />,
    );
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText(/application\/pdf, 2\.0 KB/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'report.pdf');
  });

  it('treats an attachment as a file even when its type is text', () => {
    render(<ResultViewer result={result('a,b', 'text/csv', 'attachment; filename=data.csv')} />);
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
  });

  it('falls back to result.bin and formats bytes', () => {
    render(<ResultViewer result={result('abc', 'application/octet-stream')} />);
    expect(screen.getByText('result.bin')).toBeInTheDocument();
    expect(screen.getByText(/3 bytes/)).toBeInTheDocument();
  });

  it('formats megabytes', () => {
    const blob = new Blob([new Uint8Array(3 * 1024 * 1024)]);
    render(
      <ResultViewer
        result={{ blob, contentType: 'application/zip', disposition: '', status: 200 }}
      />,
    );
    expect(screen.getByText(/3\.0 MB/)).toBeInTheDocument();
  });
});
