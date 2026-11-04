// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import RoleChips from '../RoleChips';

describe('RoleChips', () => {
  const roles = ['root', { name: 'admin', description: 'Administrators' }];

  it('renders a checkbox per role, checked for members', () => {
    render(<RoleChips roles={roles} selected={['admin']} onToggle={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'root' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'admin' })).toBeChecked();
    expect(screen.getByTitle('Administrators')).toHaveTextContent('admin');
  });

  it('toggles towards the opposite of the current membership', async () => {
    const onToggle = vi.fn();
    render(<RoleChips roles={roles} selected={['admin']} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'root' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'admin' }));
    expect(onToggle.mock.calls).toEqual([
      ['root', true],
      ['admin', false],
    ]);
  });
});
