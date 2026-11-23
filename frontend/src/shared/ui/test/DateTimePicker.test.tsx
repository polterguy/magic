// @vitest-environment jsdom
/*
 * DateTimePicker: the trigger label, opening the calendar popover, month
 * navigation, picking days (date-only closes, date-time keeps open), the min
 * bound, the time selects, Clear / Today / Now / Done, and closing by Escape or
 * an outside click.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DateTimePicker from '../DateTimePicker';

function renderPicker(props: Partial<React.ComponentProps<typeof DateTimePicker>> = {}) {
  const onChange = vi.fn();
  render(<DateTimePicker value="" onChange={onChange} {...props} />);
  return { onChange, trigger: screen.getByRole('button', { expanded: false }) };
}

describe('DateTimePicker trigger', () => {
  it('shows the default placeholder for each mode', () => {
    const { trigger } = renderPicker();
    expect(trigger).toHaveTextContent('Pick a date and time');
  });

  it('shows the date-only placeholder and honours a custom one', () => {
    const { trigger } = renderPicker({ dateOnly: true });
    expect(trigger).toHaveTextContent('Pick a date');
    expect(trigger).not.toHaveTextContent('and time');
  });

  it('shows a custom placeholder', () => {
    const { trigger } = renderPicker({ placeholder: 'When?' });
    expect(trigger).toHaveTextContent('When?');
  });

  it('formats the value as dd/mm/yyyy, hh:mm', () => {
    const { trigger } = renderPicker({ value: '2026-03-05T09:07' });
    expect(trigger).toHaveTextContent('05/03/2026, 09:07');
  });

  it('omits the time in date-only mode', () => {
    const { trigger } = renderPicker({ value: '2026-03-05', dateOnly: true });
    expect(trigger).toHaveTextContent('05/03/2026');
    expect(trigger).not.toHaveTextContent(':');
  });

  it('falls back to the placeholder for an unparseable value', () => {
    const { trigger } = renderPicker({ value: 'garbage' });
    expect(trigger).toHaveTextContent('Pick a date and time');
  });

  it('does not open when disabled', async () => {
    const { trigger } = renderPicker({ disabled: true });
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByTitle('Next month')).not.toBeInTheDocument();
  });
});

describe('DateTimePicker popover', () => {
  it('opens on the month of the value and toggles closed on a second click', async () => {
    const { trigger } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('March 2026')).toBeInTheDocument();
    await userEvent.click(trigger);
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });

  it('navigates between months', async () => {
    const { trigger } = renderPicker({ value: '2026-01-15T10:30' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByTitle('Previous month'));
    expect(screen.getByText('December 2025')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Next month'));
    await userEvent.click(screen.getByTitle('Next month'));
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('marks the selected day', async () => {
    const { trigger } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    expect(screen.getByRole('button', { name: '15' })).toHaveClass('selected');
    expect(screen.getByRole('button', { name: '16' })).not.toHaveClass('selected');
  });

  it('emits the picked day with the composed time and stays open', async () => {
    const { trigger, onChange } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: '20' }));
    expect(onChange).toHaveBeenCalledWith('2026-03-20T10:30');
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('closes after picking a day in date-only mode', async () => {
    const { trigger, onChange } = renderPicker({ value: '2026-03-15', dateOnly: true });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: '20' }));
    expect(onChange).toHaveBeenCalledWith('2026-03-20');
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });

  it('hides the time row in date-only mode', async () => {
    const { trigger } = renderPicker({ value: '2026-03-15', dateOnly: true });
    await userEvent.click(trigger);
    expect(screen.queryByText('Time')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
  });

  it('disables days before the min bound and ignores clicks on them', async () => {
    const { trigger, onChange } = renderPicker({
      value: '2026-03-15',
      dateOnly: true,
      min: '2026-03-10',
    });
    await userEvent.click(trigger);
    const early = screen.getByRole('button', { name: '7' });
    expect(early).toBeDisabled();
    await userEvent.click(early);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '10' })).toBeEnabled();
  });

  // The hour/minute menus are driven by keyboard here: they render into a portal outside the
  // popover, and a mouse press on one of their options closes the popover first (see report).
  it('re-emits the selected day when the hour or minute changes', async () => {
    const { trigger, onChange } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    const time = screen.getByText('Time').parentElement as HTMLElement;
    await userEvent.click(within(time).getByRole('button', { name: '10' }));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-03-15T11:30');
    await userEvent.click(within(time).getByRole('button', { name: '30' }));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-03-15T11:32');
  });

  it('does not emit when the time changes before any day is chosen', async () => {
    const { trigger, onChange } = renderPicker();
    await userEvent.click(trigger);
    const time = screen.getByText('Time').parentElement as HTMLElement;
    await userEvent.click(within(time).getAllByRole('button')[0]);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Clear emits an empty string and closes', async () => {
    const { trigger, onChange } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });

  it('Now emits the current date and time and stays open', async () => {
    const { trigger, onChange } = renderPicker({ value: '2020-01-01T00:00' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Now' }));
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/));
    expect(onChange).not.toHaveBeenCalledWith('2020-01-01T00:00');
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('Today emits a date-only value and closes', async () => {
    const { trigger, onChange } = renderPicker({ dateOnly: true });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('Done closes without emitting', async () => {
    const { trigger, onChange } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const { trigger } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });

  it('closes on a click outside, but not on a click inside', async () => {
    const { trigger } = renderPicker({ value: '2026-03-15T10:30' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('March 2026'));
    expect(screen.getByText('March 2026')).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });
});
