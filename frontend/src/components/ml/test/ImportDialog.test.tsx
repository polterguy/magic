// @vitest-environment jsdom
/*
 * ImportDialog: the crawl tab (start button gating, socket channel, crawl request with
 * seconds converted to milliseconds, failures) and the upload tab (per-category option
 * panels, one upload call per file with the right options, the URL-list socket flow,
 * success and error toasts). SocketFeedback is stubbed.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import ImportDialog from '../ImportDialog';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  gibberish: vi.fn(),
  importUrl: vi.fn(),
  uploadCsvFile: vi.fn(),
  uploadImageFile: vi.fn(),
  uploadTrainingFile: vi.fn(),
  uploadUrlList: vi.fn(),
}));

vi.mock('../../SocketFeedback', () => ({
  default: (
    props: Readonly<{ title: string; channel: string; onReady: () => void; onClose: () => void }>,
  ) => (
    <div>
      <span>
        {props.title} via {props.channel}
      </span>
      <button onClick={props.onReady}>Socket ready</button>
      <button onClick={props.onClose}>Close socket</button>
    </div>
  ),
}));

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderDialog() {
  const onClose = vi.fn();
  render(
    <DialogProvider>
      <ImportDialog type="support" onClose={onClose} />
    </DialogProvider>,
  );
  return { onClose };
}

async function openUploadTab() {
  await userEvent.click(screen.getByRole('button', { name: 'Upload files' }));
}

async function pickCategory(option: string) {
  await userEvent.click(screen.getByRole('button', { name: 'File category' }));
  await userEvent.click(screen.getByRole('option', { name: option }));
}

const file = (name: string) => new File(['x'], name);

describe('ImportDialog crawl tab', () => {
  it('disables Start until a URL is entered', async () => {
    renderDialog();
    expect(screen.getByText('Import into support')).toBeInTheDocument();
    const start = screen.getByRole('button', { name: 'Start crawling' });
    expect(start).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText('https://example.com'), 'https://a.test');
    expect(start).toBeEnabled();
  });

  it('opens a channel, then crawls with the entered options when the socket is ready', async () => {
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'chan-1' });
    vi.mocked(api.importUrl).mockResolvedValue(undefined as never);
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText('https://example.com'), 'https://a.test');
    await userEvent.type(screen.getByPlaceholderText('AINIRO-Website-Crawler'), 'tag');
    await userEvent.clear(screen.getByTitle('Maximum number of URLs to crawl'));
    await userEvent.type(screen.getByTitle('Maximum number of URLs to crawl'), '40');
    await userEvent.clear(screen.getByTitle('Delay between each page requested'));
    await userEvent.type(screen.getByTitle('Delay between each page requested'), '2');
    await userEvent.click(screen.getByRole('checkbox', { name: /Insert source URL/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Import images/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Start crawling' }));
    expect(await screen.findByText('Crawling https://a.test via chan-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Socket ready' }));
    expect(api.importUrl).toHaveBeenCalledWith({
      url: 'https://a.test',
      type: 'support',
      delay: 2000,
      max: 40,
      insert_url: true,
      images: false,
      meta: 'tag',
      channel: 'chan-1',
    });
  });

  it('closes the dialog when the crawl terminal is closed', async () => {
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'c' });
    const { onClose } = renderDialog();
    await userEvent.type(
      screen.getByPlaceholderText('https://example.com'),
      'https://a.test{Enter}',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Close socket' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('toasts a failed crawl request', async () => {
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'c' });
    vi.mocked(api.importUrl).mockRejectedValue(new Error('blocked'));
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText('https://example.com'), 'https://a.test');
    await userEvent.click(screen.getByRole('button', { name: 'Start crawling' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Socket ready' }));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'blocked' })),
    );
  });

  it('toasts when no channel can be created and stays on the form', async () => {
    vi.mocked(api.gibberish).mockRejectedValue(new Error('no socket'));
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText('https://example.com'), 'https://a.test');
    await userEvent.click(screen.getByRole('button', { name: 'Start crawling' }));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'no socket' })),
    );
    expect(screen.getByRole('button', { name: 'Start crawling' })).toBeEnabled();
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ImportDialog upload tab', () => {
  it('defaults to structured data with prompt and completion fields', async () => {
    vi.mocked(api.uploadTrainingFile).mockResolvedValue({ count: 3 });
    const { onClose } = renderDialog();
    await openUploadTab();
    expect(screen.getByText(/lists of objects with at least two fields/)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Prompt field'));
    await userEvent.type(screen.getByLabelText('Prompt field'), 'q');
    await userEvent.clear(screen.getByLabelText('Completion field'));
    await userEvent.type(screen.getByLabelText('Completion field'), 'a');
    const a = file('a.json');
    const b = file('b.yaml');
    await userEvent.upload(screen.getByLabelText('Select files'), [a, b]);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.uploadTrainingFile).toHaveBeenNthCalledWith(1, 'support', a, {
      promptField: 'q',
      completionField: 'a',
    });
    expect(api.uploadTrainingFile).toHaveBeenNthCalledWith(2, 'support', b, {
      promptField: 'q',
      completionField: 'a',
    });
    expect(toasts.map(t => t.text)).toContain('6 training snippets imported');
  });

  it('uploads text files, summarising and forcing CSV to text', async () => {
    vi.mocked(api.uploadTrainingFile).mockResolvedValue({ count: 1 });
    renderDialog();
    await openUploadTab();
    await pickCategory('Text (TXT, Markdown, CSV as text)');
    await userEvent.click(screen.getByRole('checkbox', { name: /Summarize each file/ }));
    const csv = file('Notes.CSV');
    await userEvent.upload(screen.getByLabelText('Select files'), csv);
    await waitFor(() =>
      expect(api.uploadTrainingFile).toHaveBeenCalledWith('support', csv, {
        summarize: true,
        forceAsText: true,
      }),
    );
  });

  it('uploads PDFs with the chosen options', async () => {
    vi.mocked(api.uploadTrainingFile).mockResolvedValue({ count: 1 });
    renderDialog();
    await openUploadTab();
    await pickCategory('PDF documents');
    await userEvent.click(screen.getByRole('checkbox', { name: /One snippet per page/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Summarize/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Overwrite existing/ }));
    await userEvent.type(screen.getByLabelText(/Massage prompt/), 'tidy');
    const pdf = file('doc.pdf');
    await userEvent.upload(screen.getByLabelText('Select files'), pdf);
    await waitFor(() =>
      expect(api.uploadTrainingFile).toHaveBeenCalledWith('support', pdf, {
        summarize: true,
        preservePages: true,
        overwrite: true,
        massage: 'tidy',
      }),
    );
  });

  it('uploads CSV and image categories through their own endpoints', async () => {
    vi.mocked(api.uploadCsvFile).mockResolvedValue({ count: 4 });
    vi.mocked(api.uploadImageFile).mockResolvedValue({ count: 1 });
    renderDialog();
    await openUploadTab();
    await pickCategory('CSV — first column prompt, rest completion');
    const csv = file('rows.csv');
    await userEvent.upload(screen.getByLabelText('Select files'), csv);
    await waitFor(() => expect(api.uploadCsvFile).toHaveBeenCalledWith('support', csv));
    expect(toasts.map(t => t.text)).toContain('4 training snippets imported');
  });

  it('reports images as images', async () => {
    vi.mocked(api.uploadImageFile).mockResolvedValue({ count: 1 });
    renderDialog();
    await openUploadTab();
    await pickCategory('Images (PNG, JPG, WEBP, GIF)');
    const png = file('pic.png');
    await userEvent.upload(screen.getByLabelText('Select files'), png);
    await waitFor(() => expect(api.uploadImageFile).toHaveBeenCalledWith('support', png));
    expect(toasts.map(t => t.text)).toContain('1 image(s) imported');
  });

  it('toasts an upload failure and keeps the dialog open', async () => {
    vi.mocked(api.uploadTrainingFile).mockRejectedValue(new Error('too big'));
    const { onClose } = renderDialog();
    await openUploadTab();
    await userEvent.upload(screen.getByLabelText('Select files'), file('a.json'));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'too big' })),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Select files')).toBeEnabled();
  });

  it('scrapes a URL list over a socket channel, optionally vectorising', async () => {
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'chan-7' });
    vi.mocked(api.uploadUrlList).mockResolvedValue(undefined as never);
    const { onClose } = renderDialog();
    await openUploadTab();
    await pickCategory('URL list (CSV of URLs to scrape)');
    await userEvent.click(screen.getByRole('checkbox', { name: /Vectorise when done/ }));
    const urls = file('urls.csv');
    await userEvent.upload(screen.getByLabelText('Select files'), urls);
    expect(await screen.findByText('Scraping URLs from urls.csv via chan-7')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Socket ready' }));
    expect(api.uploadUrlList).toHaveBeenCalledWith('support', urls, 'chan-7', true);
    await userEvent.click(screen.getByRole('button', { name: 'Close socket' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('toasts when the URL-list channel cannot be created', async () => {
    vi.mocked(api.gibberish).mockRejectedValue(new Error('no socket'));
    renderDialog();
    await openUploadTab();
    await pickCategory('URL list (CSV of URLs to scrape)');
    await userEvent.upload(screen.getByLabelText('Select files'), file('urls.csv'));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'no socket' })),
    );
  });

  it('closes from the upload tab', async () => {
    const { onClose } = renderDialog();
    await openUploadTab();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
