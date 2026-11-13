// @vitest-environment jsdom
/*
 * BusyLabel: shows the label for the current state, and reserves the other state's label as
 * hidden CSS content, so the button keeps its width and its accessible name is the visible label.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BusyLabel from '../BusyLabel';

function renderButton(busy: boolean) {
  render(
    <button>
      <BusyLabel busy={busy} label="▷ Run" busyLabel="Running…" />
    </button>,
  );
  return screen.getByRole('button');
}

describe('BusyLabel', () => {
  it('shows the idle label and reserves the width of the busy one', () => {
    const button = renderButton(false);

    expect(button).toHaveAccessibleName('▷ Run');
    expect(button.querySelector('.busy-label')).toHaveAttribute('data-alt', 'Running…');
  });

  it('shows the busy label and reserves the width of the idle one', () => {
    const button = renderButton(true);

    expect(button).toHaveAccessibleName('Running…');
    expect(button).toHaveTextContent(/^Running…$/);
    expect(button.querySelector('.busy-label')).toHaveAttribute('data-alt', '▷ Run');
  });
});
