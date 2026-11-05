// @vitest-environment jsdom
/*
 * AddColumnDialog: Enter submits from the keyboard without going through the Add button, which is
 * disabled while the column has no name, so the submit itself must refuse a nameless column.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AddColumnDialog from '../AddColumnDialog';

describe('AddColumnDialog with no column name', () => {
  it('submits nothing on Enter in a field', async () => {
    const onSubmit = vi.fn();
    render(
      <AddColumnDialog
        databaseType="sqlite"
        tableName="orders"
        tables={[]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.type(screen.getByLabelText(/^Column name/), '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'note{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].columnName).toBe('note');
  });
});
