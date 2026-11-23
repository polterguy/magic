// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import Select from '../Select';

interface HostProps {
  initial: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Holds the value the way a page would, so the trigger follows each choice.
function Host(props: Readonly<HostProps>) {
  const [value, setValue] = useState(props.initial);
  return (
    <Select
      value={value}
      onChange={next => {
        props.onChange(next);
        setValue(next);
      }}
      disabled={props.disabled}
      placeholder={props.placeholder}
    >
      <option value="a">Apple</option>
      <optgroup label="More">
        <option value="b">Banana</option>
        <option value="c" disabled>
          Cherry
        </option>
        <option value="d">Date</option>
      </optgroup>
    </Select>
  );
}

function renderSelect(
  props: Partial<{ value: string; disabled: boolean; placeholder: string }> = {},
) {
  const onChange = vi.fn();
  render(
    <Host
      initial={props.value ?? 'b'}
      onChange={onChange}
      disabled={props.disabled}
      placeholder={props.placeholder}
    />,
  );
  return { trigger: screen.getByRole('button'), onChange };
}

describe('Select', () => {
  it('shows the label of the selected value', () => {
    const { trigger } = renderSelect();
    expect(trigger).toHaveTextContent('Banana');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the placeholder when no option matches the value', () => {
    const { trigger } = renderSelect({ value: 'zzz', placeholder: 'Pick one' });
    expect(trigger).toHaveTextContent('Pick one');
  });

  it('opens a listbox with options flattened out of groups', async () => {
    const { trigger } = renderSelect();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['Apple', 'Banana', 'Cherry', 'Date']);
    expect(screen.getByRole('option', { name: /Banana/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('names the trigger with ariaLabel, keeping the value visible', () => {
    render(
      <Select value="a" onChange={vi.fn()} ariaLabel="Fruit">
        <option value="a">Apple</option>
      </Select>,
    );
    expect(screen.getByRole('button', { name: 'Fruit' })).toHaveTextContent('Apple');
  });

  it('ticks only the selected option', async () => {
    const { trigger } = renderSelect();
    await userEvent.click(trigger);
    const ticked = screen
      .getAllByRole('option')
      .filter(option => option.querySelector('.select-check svg'));
    expect(ticked.map(option => option.textContent)).toEqual(['Banana']);
  });

  it('points the trigger at the highlighted option', async () => {
    const { trigger } = renderSelect();
    expect(trigger).not.toHaveAttribute('aria-activedescendant');
    await userEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    expect(trigger).toHaveAttribute('aria-controls', listbox.id);
    const highlighted = () =>
      // useId's ids hold characters a #id selector would need escaped.
      document.querySelector(`[id="${trigger.getAttribute('aria-activedescendant')}"]`);
    expect(highlighted()).toHaveTextContent('Banana');
    await userEvent.keyboard('{ArrowDown}');
    // Cherry is disabled, so the highlight skips it.
    expect(highlighted()).toHaveTextContent('Date');
  });

  it('opens below the trigger when there is room', async () => {
    const { trigger } = renderSelect();
    trigger.getBoundingClientRect = () => new DOMRect(10, 100, 120, 36);
    await userEvent.click(trigger);
    const menu = screen.getByRole('listbox');
    expect(menu.style.top).toBe(100 + 36 + 4 + 'px');
    expect(menu.style.bottom).toBe('');
  });

  it('opens above the trigger near the bottom of the window', async () => {
    const { trigger } = renderSelect();
    const top = window.innerHeight - 50;
    trigger.getBoundingClientRect = () => new DOMRect(10, top, 120, 36);
    await userEvent.click(trigger);
    const menu = screen.getByRole('listbox');
    expect(menu.style.bottom).toBe(window.innerHeight - top + 4 + 'px');
    expect(menu.style.top).toBe('');
    // Never taller than the room above it.
    expect(Number.parseFloat(menu.style.maxHeight)).toBeLessThanOrEqual(top);
  });

  it('chooses an option by mouse and closes', async () => {
    const { trigger, onChange } = renderSelect();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'Date' }));
    expect(onChange).toHaveBeenCalledWith('d');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Date');
    expect(trigger).toHaveFocus();
  });

  it('ignores clicks on a disabled option', async () => {
    const { trigger, onChange } = renderSelect();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    const { trigger } = renderSelect();
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('toggles closed when the trigger is clicked again', async () => {
    const { trigger } = renderSelect();
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens with ArrowDown and moves past disabled options to choose with Enter', async () => {
    const { trigger, onChange } = renderSelect();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // Highlight starts on the selected Banana; the next step skips the disabled Cherry.
    expect(screen.getByRole('option', { name: /Banana/ })).toHaveClass('active');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Date' })).toHaveClass('active');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('d');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('wraps around with ArrowUp', async () => {
    const { trigger, onChange } = renderSelect({ value: 'a' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    expect(onChange).toHaveBeenCalledWith('d');
  });

  it('opens with Space and closes with Escape without choosing', async () => {
    const { trigger, onChange } = renderSelect();
    trigger.focus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('chooses by type-ahead while closed', async () => {
    const { trigger, onChange } = renderSelect();
    trigger.focus();
    await userEvent.keyboard('a');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('only highlights the type-ahead match while open', async () => {
    const { trigger, onChange } = renderSelect();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}d');
    expect(screen.getByRole('option', { name: 'Date' })).toHaveClass('active');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not open or respond to keys when disabled', async () => {
    const { trigger, onChange } = renderSelect({ disabled: true });
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
