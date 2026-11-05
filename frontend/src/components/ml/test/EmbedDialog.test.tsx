// @vitest-environment jsdom
/*
 * EmbedDialog: builds the include-script for the chatbot from the chosen options, offers only the
 * modern themes the backend lists, copies the script, and stops claiming it is copied once an
 * option changes.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import * as toast from '../../../lib/toast';
import EmbedDialog from '../EmbedDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/toast')>()),
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const BASE =
  'https://cloudlet.test/magic/system/openai/include-chatbot.js?' +
  'rtl=false&follow_up=true&copyButton=false&references=false&position=right&type=support' +
  '&header=Ask%20about%20our%20services%20or%20products&button=AI%20Chatbot' +
  '&placeholder=Ask%20me%20anything%20...&color=%23fefefe&start=%237892e5&end=%23142660' +
  '&link=%23fe8464&theme=modern-square';

beforeEach(() => {
  vi.mocked(api.backendInfo).mockReturnValue({ url: 'https://cloudlet.test', token: 't' });
  vi.mocked(api.openaiThemes).mockResolvedValue(['classic', 'modern-square', 'modern-round']);
});

afterEach(() => {
  vi.clearAllMocks();
});

function scriptText() {
  return document.querySelector('pre')!.textContent;
}

function renderDialog() {
  const onClose = vi.fn();
  render(<EmbedDialog type="support" onClose={onClose} />);
  return { onClose };
}

async function pick(current: string, option: string) {
  await userEvent.click(screen.getByText(current, { selector: '.select-value' }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('EmbedDialog', () => {
  it('shows the default script for the model', () => {
    renderDialog();
    expect(screen.getByText('Embed support')).toBeInTheDocument();
    expect(scriptText()).toBe('<script src="' + BASE + '" defer></script>');
  });

  it('offers only the modern themes the backend lists', async () => {
    renderDialog();
    await userEvent.click(screen.getByText('modern-square', { selector: '.select-value' }));
    expect(await screen.findByRole('option', { name: 'modern-round' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'classic' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'modern-round' }));
    expect(scriptText()).toContain('theme=modern-round');
  });

  it('falls back to the default theme when the themes cannot be loaded', async () => {
    vi.mocked(api.openaiThemes).mockRejectedValueOnce(new Error('offline'));
    renderDialog();
    await userEvent.click(screen.getByText('modern-square', { selector: '.select-value' }));
    expect(await screen.findAllByRole('option')).toHaveLength(1);
  });

  it('encodes the text options into the script', async () => {
    renderDialog();
    await userEvent.clear(screen.getByLabelText('Header'));
    await userEvent.type(screen.getByLabelText('Header'), 'Hi & bye?');
    await userEvent.clear(screen.getByLabelText('Button text'));
    await userEvent.type(screen.getByLabelText('Button text'), 'Chat now');
    await userEvent.clear(screen.getByLabelText('Input placeholder'));
    await userEvent.type(screen.getByLabelText('Input placeholder'), 'Type');
    const text = scriptText();
    expect(text).toContain('header=Hi%20%26%20bye%3F');
    expect(text).toContain('button=Chat%20now');
    expect(text).toContain('placeholder=Type');
  });

  it('puts the colours into the script', () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText('Gradient start'), { target: { value: '#111111' } });
    fireEvent.change(screen.getByLabelText('Gradient end'), { target: { value: '#222222' } });
    fireEvent.change(screen.getByLabelText('Foreground'), { target: { value: '#333333' } });
    fireEvent.change(screen.getByLabelText('Links'), { target: { value: '#444444' } });
    const text = scriptText();
    expect(text).toContain('start=%23111111');
    expect(text).toContain('end=%23222222');
    expect(text).toContain('color=%23333333');
    expect(text).toContain('link=%23444444');
  });

  it('toggles the boolean options', async () => {
    renderDialog();
    await userEvent.click(screen.getByLabelText('References'));
    await userEvent.click(screen.getByLabelText('Follow-up questions'));
    await userEvent.click(screen.getByLabelText('Copy button'));
    await userEvent.click(screen.getByLabelText('Right-to-left'));
    let text = scriptText();
    expect(text).toContain('rtl=true&follow_up=false&copyButton=true&references=true');
    expect(text).not.toContain('sticky');
    expect(text).not.toContain('history');
    expect(text).not.toContain('attachments');

    await userEvent.click(screen.getByLabelText('Sticky'));
    await userEvent.click(screen.getByLabelText('History'));
    await userEvent.click(screen.getByLabelText('Attachments'));
    text = scriptText();
    expect(text).toContain('&sticky=true&history=true&attachments=true');
  });

  it('adds position and animation', async () => {
    renderDialog();
    await pick('right', 'left');
    expect(scriptText()).toContain('position=left');
    expect(scriptText()).not.toContain('animation');
    await pick('none', 'fadeIn');
    expect(scriptText()).toContain('&animation=fadeIn');
  });

  it('copies the script and reverts the button label once an option changes', async () => {
    renderDialog();
    const script = scriptText();
    await userEvent.click(screen.getByRole('button', { name: 'Copy embed code' }));
    expect(toast.copyToClipboard).toHaveBeenCalledWith(script, 'The embed script');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Sticky'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copy embed code' })).toBeInTheDocument(),
    );
  });

  it('closes', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
