// @vitest-environment jsdom
/*
 * Chat Ops attach menu: Upload and Analyse come from one Attach button, choosing one opens
 * the file picker and decides how the message's files are sent (the upload-only flag), the
 * mode can't be switched while files are waiting, and Analyse is off on a local backend.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { backendInfo, chatPrompt, gibberish } from '../../lib/api';
import { createSocket } from '../../lib/socket';
import ChatDrawer from '../ChatDrawer';

vi.mock('../../lib/socket', () => ({ createSocket: vi.fn() }));
vi.mock('../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  backendInfo: vi.fn(),
  chatPrompt: vi.fn(),
  gibberish: vi.fn(),
}));

function renderDrawer(backendUrl = 'https://app.example.com') {
  vi.mocked(backendInfo).mockReturnValue({ url: backendUrl, token: null });
  const { container } = render(<ChatDrawer open userId="root" onClose={vi.fn()} />);
  return container;
}

async function attach(container: HTMLElement, item: 'Upload' | 'Analyse', name = 'a.txt') {
  const picker = vi.spyOn(HTMLInputElement.prototype, 'click');
  await userEvent.click(screen.getByTitle(/Attach files/));
  await userEvent.click(screen.getByRole('menuitem', { name: item }));
  expect(picker).toHaveBeenCalledTimes(1);
  picker.mockRestore();
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  await userEvent.upload(input, new File(['x'], name));
}

async function send(text: string) {
  await userEvent.type(screen.getByPlaceholderText(/Ask the default model/), text);
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
}

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(gibberish).mockResolvedValue({ result: 'sess' });
  vi.mocked(chatPrompt).mockResolvedValue({ execution_id: 'run-1' });
  vi.mocked(createSocket).mockReturnValue({
    start: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
  } as never);
});

describe('Attach menu', () => {
  it('offers Upload and Analyse from one Attach button', async () => {
    renderDrawer();
    expect(screen.getByTitle(/Attach files/)).toHaveTextContent('Attach');
    await userEvent.click(screen.getByTitle(/Attach files/));
    expect(screen.getByRole('menuitem', { name: 'Upload' })).not.toHaveClass('disabled');
    expect(screen.getByRole('menuitem', { name: 'Analyse' })).not.toHaveClass('disabled');
  });

  it('opens on Analyse for a public backend', async () => {
    renderDrawer('https://app.example.com');
    await userEvent.click(screen.getByTitle(/Attach files/));
    expect(screen.getByRole('menuitem', { name: 'Analyse' })).toHaveClass('active');
    expect(screen.getByRole('menuitem', { name: 'Upload' })).not.toHaveClass('active');
  });

  it('opens on Upload for a local backend', async () => {
    renderDrawer('http://localhost:5000');
    await userEvent.click(screen.getByTitle(/Attach files/));
    expect(screen.getByRole('menuitem', { name: 'Upload' })).toHaveClass('active');
    expect(screen.getByRole('menuitem', { name: 'Analyse' })).not.toHaveClass('active');
  });

  it('opens on the mode of the files that are waiting', async () => {
    const container = renderDrawer('https://app.example.com');
    await attach(container, 'Upload');
    await userEvent.click(screen.getByTitle(/Attach files/));
    expect(screen.getByRole('menuitem', { name: 'Upload' })).toHaveClass('active');
  });

  it('sends Upload files with the upload-only flag', async () => {
    const container = renderDrawer();
    await attach(container, 'Upload');
    expect(container.querySelector('.chat-mode')).toHaveTextContent('Upload');
    await send('read it');
    expect(chatPrompt).toHaveBeenCalledWith(
      'sess',
      'read it',
      'root',
      [expect.objectContaining({ name: 'a.txt' })],
      true,
    );
  });

  it('sends Analyse files without it', async () => {
    const container = renderDrawer();
    await attach(container, 'Analyse');
    expect(container.querySelector('.chat-mode')).toHaveTextContent('Analyse');
    await send('look at it');
    expect(chatPrompt).toHaveBeenCalledWith(
      'sess',
      'look at it',
      'root',
      [expect.objectContaining({ name: 'a.txt' })],
      false,
    );
  });

  it('sends no flag and no files when nothing is attached', async () => {
    renderDrawer();
    await send('hello');
    expect(chatPrompt).toHaveBeenCalledWith('sess', 'hello', 'root', undefined, false);
  });

  it('does not offer the other mode while files are waiting', async () => {
    const container = renderDrawer();
    await attach(container, 'Upload');
    await userEvent.click(screen.getByTitle(/Attach files/));
    const analyse = screen.getByRole('menuitem', { name: 'Analyse' });
    expect(analyse).toHaveClass('disabled');
    expect(analyse).toHaveAttribute('title', 'Remove the attached files to switch to Analyse');
    expect(screen.getByRole('menuitem', { name: 'Upload' })).not.toHaveClass('disabled');
  });

  it.each(['http://localhost:5000', 'http://127.0.0.1:5000'])(
    'turns Analyse off on %s',
    async url => {
      renderDrawer(url);
      await userEvent.click(screen.getByTitle(/Attach files/));
      const analyse = screen.getByRole('menuitem', { name: 'Analyse' });
      expect(analyse).toHaveClass('disabled');
      expect(analyse.getAttribute('title')).toMatch(/not localhost/);
      expect(screen.getByRole('menuitem', { name: 'Upload' })).not.toHaveClass('disabled');
    },
  );
});
