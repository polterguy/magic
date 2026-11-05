// @vitest-environment jsdom
/*
 * GitDialog: edits magic.git.github in the configuration JSON text. Fields start from the stored
 * values (host defaulting to github.com), and Save hands back the whole config with only that
 * section replaced; api-base is stored only when filled in, and invalid JSON saves nothing.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DialogProvider } from '../../Dialogs';
import GitDialog from '../GitDialog';

function renderDialog(config: string) {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(
    <DialogProvider>
      <GitDialog config={config} onClose={onClose} onSave={onSave} />
    </DialogProvider>,
  );
  return { onClose, onSave };
}

function saved(onSave: ReturnType<typeof vi.fn>) {
  return JSON.parse(onSave.mock.calls[0][0] as string) as Record<string, unknown>;
}

describe('GitDialog', () => {
  it('starts with the stored values', () => {
    renderDialog(
      JSON.stringify({
        magic: {
          git: {
            github: {
              username: 'octo',
              token: 'tok',
              host: 'ghe.test',
              'api-base': 'https://api.ghe.test',
            },
          },
        },
      }),
    );
    expect(screen.getByLabelText(/^Username/)).toHaveValue('octo');
    expect(screen.getByLabelText(/^Token/)).toHaveValue('tok');
    expect(screen.getByLabelText(/^Host/)).toHaveValue('ghe.test');
    expect(screen.getByLabelText(/^API base/)).toHaveValue('https://api.ghe.test');
  });

  it('defaults to empty credentials and github.com when nothing is stored', () => {
    renderDialog('{}');
    expect(screen.getByLabelText(/^Username/)).toHaveValue('');
    expect(screen.getByLabelText(/^Token/)).toHaveValue('');
    expect(screen.getByLabelText(/^Host/)).toHaveValue('github.com');
    expect(screen.getByLabelText(/^API base/)).toHaveValue('');
  });

  it('defaults the same way when the config is not valid JSON', () => {
    renderDialog('{ nope');
    expect(screen.getByLabelText(/^Host/)).toHaveValue('github.com');
  });

  it('saves the edited section into a config that had none, leaving the rest alone', async () => {
    const { onSave } = renderDialog(JSON.stringify({ other: { keep: 1 } }));
    await userEvent.type(screen.getByLabelText(/^Username/), 'octo');
    await userEvent.type(screen.getByLabelText(/^Token/), 'tok');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(saved(onSave)).toEqual({
      other: { keep: 1 },
      magic: { git: { github: { username: 'octo', token: 'tok', host: 'github.com' } } },
    });
    // Pretty printed with two spaces, the way the editor shows it.
    expect(onSave.mock.calls[0][0]).toContain('\n  "other"');
  });

  it('keeps sibling settings next to the replaced section', async () => {
    const { onSave } = renderDialog(
      JSON.stringify({
        magic: { git: { github: { username: 'old', stale: true }, gitlab: { host: 'gl' } }, x: 1 },
      }),
    );
    await userEvent.clear(screen.getByLabelText(/^Username/));
    await userEvent.type(screen.getByLabelText(/^Username/), 'new');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saved(onSave)).toEqual({
      magic: {
        git: { github: { username: 'new', token: '', host: 'github.com' }, gitlab: { host: 'gl' } },
        x: 1,
      },
    });
  });

  it('stores the API base only when it is filled in', async () => {
    const { onSave } = renderDialog('{}');
    await userEvent.type(screen.getByLabelText(/^Host/), '.enterprise');
    await userEvent.type(screen.getByLabelText(/^API base/), 'https://api.enterprise.test');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved(onSave)).toEqual({
      magic: {
        git: {
          github: {
            username: '',
            token: '',
            host: 'github.com.enterprise',
            'api-base': 'https://api.enterprise.test',
          },
        },
      },
    });
  });

  it('replaces non-object values on the path with objects', async () => {
    const { onSave } = renderDialog(JSON.stringify({ magic: { git: 'broken' } }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved(onSave)).toEqual({
      magic: { git: { github: { username: '', token: '', host: 'github.com' } } },
    });
  });

  it('saves nothing when the config is not a JSON object', async () => {
    const { onSave } = renderDialog('[1, 2]');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves on Enter in a field', async () => {
    const { onSave } = renderDialog('{}');
    await userEvent.type(screen.getByLabelText(/^Username/), 'octo{Enter}');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('links to the token settings page', () => {
    renderDialog('{}');
    expect(
      screen.getByRole('link', { name: 'fine-grained personal access token' }),
    ).toHaveAttribute('href', 'https://github.com/settings/personal-access-tokens');
  });

  it('closes on Cancel without saving', async () => {
    const { onClose, onSave } = renderDialog('{}');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
