// @vitest-environment jsdom
/*
 * ScheduleDialog: three modes (repeat is the default, fixed date, custom pattern). The Schedule
 * button follows whether the active mode has a value, and saves the [due, repeats] pair for that
 * mode.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ScheduleDialog from '../ScheduleDialog';

function renderDialog() {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<ScheduleDialog taskId="cleanup" onClose={onClose} onSave={onSave} />);
  return { onClose, onSave };
}

describe('ScheduleDialog repeat mode', () => {
  it('names the task and starts in repeat mode with 5 minutes', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: 'Schedule cleanup' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Repeating/ })).toBeChecked();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'minutes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
  });

  it('saves the default repetition', async () => {
    const { onSave } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(onSave).toHaveBeenCalledWith(undefined, '5.minutes');
  });

  it('saves the chosen number and period', async () => {
    const { onSave } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    await userEvent.click(screen.getByRole('option', { name: '30' }));
    await userEvent.click(screen.getByRole('button', { name: 'minutes' }));
    await userEvent.click(screen.getByRole('option', { name: 'hours' }));
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(onSave).toHaveBeenCalledWith(undefined, '30.hours');
  });

  it('closes on Cancel', async () => {
    const { onClose, onSave } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('ScheduleDialog fixed date mode', () => {
  async function openFixed() {
    await userEvent.click(screen.getByRole('radio', { name: /fixed date/ }));
  }

  it('shows the date picker and disables Schedule until a date is picked', async () => {
    renderDialog();
    await openFixed();
    expect(screen.queryByRole('button', { name: '5' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick a date and time' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();
  });

  it('saves the picked date as an ISO timestamp', async () => {
    const { onSave } = renderDialog();
    await openFixed();
    await userEvent.click(screen.getByRole('button', { name: 'Pick a date and time' }));
    await userEvent.click(screen.getByRole('button', { name: '20' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [due, repeats] = onSave.mock.calls[0] as [string, string | undefined];
    expect(repeats).toBeUndefined();
    expect(new Date(due).toISOString()).toBe(due);
    expect(new Date(due).getDate()).toBe(20);
  });
});

describe('ScheduleDialog custom pattern mode', () => {
  async function openCustom() {
    await userEvent.click(screen.getByRole('radio', { name: /Custom/ }));
  }

  it('disables Schedule until a pattern is typed and explains the syntax', async () => {
    renderDialog();
    await openCustom();
    expect(screen.getByText('MM.dd.HH.mm.ss')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\./), 'Monday|Friday.09.00.00');
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
  });

  it('saves on Enter in the pattern field, but does nothing while it is empty', async () => {
    const { onSave } = renderDialog();
    await openCustom();
    const pattern = screen.getByPlaceholderText(/e\.g\./);
    await userEvent.type(pattern, '{Enter}');
    expect(onSave).not.toHaveBeenCalled();
    await userEvent.type(pattern, '**.**.17.30.00{Enter}');
    expect(onSave).toHaveBeenCalledWith(undefined, '**.**.17.30.00');
  });

  it('saves the pattern verbatim', async () => {
    const { onSave } = renderDialog();
    await openCustom();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\./), 'Monday|Friday.09.00.00');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(onSave).toHaveBeenCalledWith(undefined, 'Monday|Friday.09.00.00');
  });

  it('switches back to repeat mode and hides the pattern', async () => {
    renderDialog();
    await openCustom();
    await userEvent.click(screen.getByRole('radio', { name: /Repeating/ }));
    expect(screen.queryByPlaceholderText(/e\.g\./)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
  });
});
