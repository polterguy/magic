// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ColumnRow from '../ColumnRow';
import type { ColumnLock, CrudColumn } from '../types';

function renderRow(column: Partial<CrudColumn>, lock: ColumnLock = { mode: 'none', slot: '' }) {
  const onLock = vi.fn();
  const { container } = render(
    <ColumnRow column={{ name: 'owner', db: 'TEXT', ...column }} lock={lock} onLock={onLock} />,
  );
  return { onLock, container };
}

describe('ColumnRow', () => {
  it('shows the column and its lock', () => {
    renderRow({ nullable: true });
    expect(screen.getByText('owner')).toBeInTheDocument();
    expect(screen.getByText('nullable')).toBeInTheDocument();
    const lock = screen.getByRole('button', { name: 'Lock owner to' });
    expect(lock).toHaveTextContent('Not locked');
  });

  it('offers no lock on a primary key', () => {
    renderRow({ primary: true });
    expect(screen.getByText('PK')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses the compact Select', () => {
    const { container } = renderRow({});
    expect(container.querySelector('.gen-col-lock .select')).toHaveClass('select-sm');
  });

  it('reports a new lock, keeping the slot', async () => {
    const { onLock } = renderRow({}, { mode: 'none', slot: 'kept' });
    await userEvent.click(screen.getByRole('button', { name: 'Lock owner to' }));
    await userEvent.click(screen.getByRole('option', { name: 'Current username' }));
    expect(onLock).toHaveBeenCalledWith({ mode: 'username', slot: 'kept' });
  });

  it('asks for the slot of a custom lock', async () => {
    const { onLock } = renderRow({}, { mode: 'custom', slot: '' });
    await userEvent.type(screen.getByRole('textbox', { name: 'Slot for owner' }), 'x');
    expect(onLock).toHaveBeenLastCalledWith({ mode: 'custom', slot: 'x' });
  });

  it('shows no slot box for the other locks', () => {
    renderRow({}, { mode: 'username', slot: '' });
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
