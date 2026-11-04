// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Tabs from '../Tabs';

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
];

describe('Tabs', () => {
  it('marks only the active tab', () => {
    render(<Tabs tabs={TABS} active="roles" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Roles' })).toHaveClass('tab', 'active');
    expect(screen.getByRole('button', { name: 'Users' })).not.toHaveClass('active');
  });

  it('reports the id of the clicked tab', async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} active="users" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Roles' }));
    expect(onChange).toHaveBeenCalledWith('roles');
  });
});
