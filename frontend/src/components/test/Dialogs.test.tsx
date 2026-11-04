// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogProvider, Modal } from '../Dialogs';
import { useDialog } from '../../lib/useDialog';
import { setToastListener, type Toast } from '../../lib/toast';

type Dialogs = ReturnType<typeof useDialog>;

// Opens whichever dialog `open` asks for and records what its promise settled with.
function Harness(props: Readonly<{ open: (dialogs: Dialogs) => Promise<unknown> }>) {
  const dialogs = useDialog();
  const [result, setResult] = useState<string>('pending');
  return (
    <>
      <button
        onClick={() => {
          void props.open(dialogs).then(value => setResult(JSON.stringify(value)));
        }}
      >
        Open
      </button>
      <output>{result}</output>
    </>
  );
}

async function openDialog(open: (dialogs: Dialogs) => Promise<unknown>) {
  render(
    <DialogProvider>
      <Harness open={open} />
    </DialogProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  return screen.getByRole('dialog');
}

async function expectResult(value: unknown) {
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(JSON.stringify(value)));
}

afterEach(() => {
  setToastListener(null);
});

describe('DialogProvider confirm', () => {
  it('renders the title, message and button texts', async () => {
    const dialog = await openDialog(d =>
      d.confirm({
        title: 'Delete it?',
        message: 'No way back',
        confirmText: 'Delete',
        danger: true,
      }),
    );
    expect(dialog).toHaveTextContent('Delete it?');
    expect(dialog).toHaveTextContent('No way back');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('btn-danger');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('defaults the confirm button to OK', async () => {
    await openDialog(d => d.confirm({ title: 'Sure?' }));
    expect(screen.getByRole('button', { name: 'OK' })).not.toHaveClass('btn-danger');
  });

  it('resolves true on confirm and closes', async () => {
    await openDialog(d => d.confirm({ title: 'Sure?' }));
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expectResult(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves false on cancel', async () => {
    await openDialog(d => d.confirm({ title: 'Sure?' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectResult(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves false on Escape', async () => {
    await openDialog(d => d.confirm({ title: 'Sure?' }));
    await userEvent.keyboard('{Escape}');
    await expectResult(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves false when the backdrop is clicked', async () => {
    const dialog = await openDialog(d => d.confirm({ title: 'Sure?' }));
    await userEvent.click(dialog.parentElement!);
    await expectResult(false);
  });
});

describe('DialogProvider prompt', () => {
  it('returns the entered value', async () => {
    await openDialog(d => d.prompt({ title: 'Name', label: 'Username' }));
    const input = screen.getByLabelText('Username');
    expect(input).toHaveFocus();
    await userEvent.type(input, 'thomas');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expectResult('thomas');
  });

  it('starts from the initial value, selected so typing replaces it', async () => {
    await openDialog(d => d.prompt({ title: 'Rename', label: 'File', initial: 'old.hl' }));
    const input = screen.getByLabelText<HTMLInputElement>('File');
    expect(input).toHaveValue('old.hl');
    await userEvent.keyboard('new.hl');
    expect(input).toHaveValue('new.hl');
  });

  it('submits on Enter', async () => {
    await openDialog(d => d.prompt({ title: 'Name', label: 'Username' }));
    await userEvent.type(screen.getByLabelText('Username'), 'root{Enter}');
    await expectResult('root');
  });

  it('returns null on cancel and on Escape', async () => {
    await openDialog(d => d.prompt({ title: 'Name', label: 'Username' }));
    await userEvent.type(screen.getByLabelText('Username'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectResult(null);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.keyboard('{Escape}');
    await expectResult(null);
  });

  it('masks a password prompt without inviting autofill', async () => {
    await openDialog(d => d.prompt({ title: 'Secret', label: 'Password', password: true }));
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
  });
});

describe('DialogProvider confirmTyped', () => {
  const options = {
    title: 'Delete user',
    message: 'Type the username',
    label: 'Username',
    expected: 'thomas',
  };

  it('labels the action Delete by default', async () => {
    await openDialog(d => d.confirmTyped(options));
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('resolves true when the exact name is typed', async () => {
    await openDialog(d => d.confirmTyped(options));
    await userEvent.type(screen.getByLabelText('Username'), 'thomas');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await expectResult(true);
  });

  it('resolves false and shows an error toast when the name does not match', async () => {
    const toasts: Toast[] = [];
    setToastListener(toast => toasts.push(toast));
    await openDialog(d => d.confirmTyped({ ...options, mismatch: 'Wrong name' }));
    await userEvent.type(screen.getByLabelText('Username'), 'Thomas');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await expectResult(false);
    expect(toasts).toEqual([expect.objectContaining({ text: 'Wrong name', isError: true })]);
  });

  it('resolves false without a toast when cancelled', async () => {
    const listener = vi.fn();
    setToastListener(listener);
    await openDialog(d => d.confirmTyped(options));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectResult(false);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('DialogProvider form', () => {
  it('collects one value per field', async () => {
    await openDialog(d =>
      d.form({
        title: 'Arguments',
        fields: [
          { name: 'name', mandatory: true },
          { name: 'age', type: 'int' },
        ],
      }),
    );
    const name = screen.getByRole('textbox');
    const age = screen.getByRole('spinbutton');
    expect(name).toHaveFocus();
    expect(name).toBeRequired();
    expect(age).not.toBeRequired();
    await userEvent.type(name, 'Jo');
    await userEvent.type(age, '42');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expectResult({ name: 'Jo', age: '42' });
  });

  it('returns null on cancel', async () => {
    await openDialog(d => d.form({ title: 'Arguments', fields: [{ name: 'name' }] }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectResult(null);
  });
});

describe('DialogProvider choice', () => {
  const buttons = [
    { label: 'Save', value: 'save', kind: 'primary' as const },
    { label: 'Discard', value: 'discard', kind: 'danger' as const },
    { label: 'Later', value: 'later' },
  ];

  it('renders one button per choice, styled by kind, and no Cancel/OK', async () => {
    await openDialog(d => d.choice({ title: 'Unsaved', buttons }));
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('btn');
    expect(screen.getByRole('button', { name: 'Discard' })).toHaveClass('btn-danger');
    expect(screen.getByRole('button', { name: 'Later' })).toHaveClass('btn-secondary');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('resolves with the value of the clicked button', async () => {
    await openDialog(d => d.choice({ title: 'Unsaved', buttons }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await expectResult('discard');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves null on Escape', async () => {
    await openDialog(d => d.choice({ title: 'Unsaved', buttons }));
    await userEvent.keyboard('{Escape}');
    await expectResult(null);
  });
});

describe('Modal', () => {
  it('focuses the dialog box when nothing inside claims focus, and restores focus on close', async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Opener</button>
          {open && (
            <Modal onClose={() => setOpen(false)}>
              <p>Body</p>
            </Modal>
          )}
        </>
      );
    }
    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Opener' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('only closes the topmost modal on Escape', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Modal onClose={outer}>outer</Modal>
        <Modal onClose={inner}>inner</Modal>
      </>,
    );
    await userEvent.keyboard('{Escape}');
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('leaves Escape to an open editor popup', async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <div className="cm-tooltip-autocomplete" />
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stacks a later modal above an earlier one', () => {
    render(
      <>
        <Modal onClose={vi.fn()}>first</Modal>
        <Modal onClose={vi.fn()}>second</Modal>
      </>,
    );
    const [first, second] = screen
      .getAllByRole('dialog')
      .map(d => Number(d.parentElement!.style.zIndex));
    expect(second).toBeGreaterThan(first);
  });

  it('closes on a backdrop mousedown but not on one inside the box', async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await userEvent.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab inside the dialog', async () => {
    render(
      <Modal onClose={vi.fn()}>
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();
    await userEvent.tab();
    expect(first).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('submits on Enter in a plain input, but not in a textarea or a nested form', async () => {
    const onSubmit = vi.fn();
    render(
      <Modal onClose={vi.fn()} onSubmit={onSubmit}>
        <input aria-label="plain" />
        <textarea aria-label="area" />
        <form>
          <input aria-label="nested" />
        </form>
      </Modal>,
    );
    await userEvent.type(screen.getByLabelText('area'), '{Enter}');
    await userEvent.type(screen.getByLabelText('nested'), '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('plain'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
