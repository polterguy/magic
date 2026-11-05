// @vitest-environment jsdom
/*
 * DebugDialog (Rewind): the empty state, the step table and counter, stepping with
 * the buttons, rows, scrubber and arrow keys, the error and returned-value shortcuts,
 * and which lambda / highlight the (stubbed) code editor is handed.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { DebugRecording } from '../../lib/api';
import DebugDialog from '../DebugDialog';

vi.mock('../CodeEditor', () => ({
  default: (props: Readonly<{ value: string; mode: string; highlightLine?: number }>) => (
    <pre data-testid="editor" data-mode={props.mode} data-line={props.highlightLine}>
      {props.value}
    </pre>
  ),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const FIRST = 'log.info:one\ncreate-node:two';
const SECOND = 'log.info:one\ncreate-node:two\nreturn:three';

const recording: DebugRecording = {
  steps: [
    { slot: 'log.info', path: '0', elapsed: 2, lambda: FIRST },
    { slot: 'create-node', path: '1', elapsed: 3, lambda: SECOND },
  ],
};

function renderDialog(rec: DebugRecording) {
  const onClose = vi.fn();
  render(<DebugDialog filename="/etc/test.hl" recording={rec} onClose={onClose} />);
  return { onClose };
}

const editor = () => screen.getByTestId('editor');

describe('DebugDialog', () => {
  it('shows an empty state when nothing was recorded', () => {
    renderDialog({ steps: [] });
    expect(screen.getByText(/Nothing was recorded/)).toBeInTheDocument();
    expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
  });

  it('treats null steps as empty', () => {
    renderDialog({ steps: null });
    expect(screen.getByText(/Nothing was recorded/)).toBeInTheDocument();
  });

  it('lists the steps with the filename, count and total time', () => {
    renderDialog(recording);
    expect(screen.getByText('/etc/test.hl')).toBeInTheDocument();
    expect(screen.getByText(/2 steps · 5 ms/)).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'log.info' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'create-node' })).toBeInTheDocument();
  });

  it('uses the singular for one step', () => {
    renderDialog({ steps: [recording.steps![0]] });
    expect(screen.getByText(/1 step · 2 ms/)).toBeInTheDocument();
  });

  it('opens on the first step, with its lambda and highlighted line', () => {
    renderDialog(recording);
    expect(editor()).toHaveTextContent('log.info:one');
    expect(editor()).toHaveAttribute('data-mode', 'hyperlambda');
    expect(editor()).toHaveAttribute('data-line', '0');
    expect(screen.getByRole('button', { name: /Prev/ })).toBeDisabled();
  });

  it('steps with Next and Prev', async () => {
    renderDialog(recording);
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(editor()).toHaveTextContent('return:three');
    expect(editor()).toHaveAttribute('data-line', '1');
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Prev/ }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('jumps to a step by clicking its row', async () => {
    renderDialog(recording);
    await userEvent.click(screen.getByRole('cell', { name: 'create-node' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('follows the scrubber', () => {
    renderDialog(recording);
    fireEvent.change(screen.getByLabelText('Execution step'), { target: { value: '1' } });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('steps with the arrow keys and stays within bounds', async () => {
    renderDialog(recording);
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('leaves arrow keys to the scrubber when it has focus', () => {
    renderDialog(recording);
    screen.getByLabelText('Execution step').focus();
    fireEvent.keyDown(screen.getByLabelText('Execution step'), { key: 'ArrowRight' });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('does not highlight a line whose name is not the slot that ran', () => {
    renderDialog({
      steps: [{ slot: 'other', path: '0', elapsed: 1, lambda: 'log.info:x' }],
    });
    expect(editor()).toHaveAttribute('data-line', '-1');
  });

  it('resolves nested paths and skips verbatim multi-line strings', () => {
    const lambda = 'a\n   b:@"line ""one""\nsecond"\n   c\nd';
    renderDialog({ steps: [{ slot: 'c', path: '0.1', elapsed: 1, lambda }] });
    expect(editor()).toHaveAttribute('data-line', '3');
  });

  it('does not highlight when the path is missing or does not exist', () => {
    renderDialog({ steps: [{ slot: 'a', path: '5', elapsed: 1, lambda: 'a' }] });
    expect(editor()).toHaveAttribute('data-line', '-1');
  });

  it('jumps to the statement that threw via the error badge', async () => {
    renderDialog({
      ...recording,
      error: { message: 'Boom happened', type: 'HyperlambdaException' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Boom happened' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('adds the returned value as a final step and shows it as JSON', async () => {
    renderDialog({ ...recording, returned: { ok: true } });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /returned/ }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(editor()).toHaveAttribute('data-mode', 'application/json');
    expect(editor().textContent).toContain('"ok": true');
  });

  it('summarises a returned list by its size', () => {
    renderDialog({ ...recording, returned: [1, 2, 3] });
    expect(screen.getByRole('button', { name: 'returned 3 items' })).toBeInTheDocument();
  });

  it('summarises a single-item list in the singular', () => {
    renderDialog({ ...recording, returned: [1] });
    expect(screen.getByRole('button', { name: 'returned 1 item' })).toBeInTheDocument();
  });

  it('shows a scalar returned value', () => {
    renderDialog({ ...recording, returned: 'hello' });
    expect(screen.getByRole('button', { name: 'returned hello' })).toBeInTheDocument();
  });

  it('shows an object returned value as truncated JSON', () => {
    renderDialog({ ...recording, returned: { a: 1 } });
    expect(screen.getByRole('button', { name: 'returned {"a":1}' })).toBeInTheDocument();
  });

  it('calls onClose from the Close button', async () => {
    const { onClose } = renderDialog(recording);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
