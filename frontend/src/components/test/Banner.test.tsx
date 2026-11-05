// @vitest-environment jsdom
/*
 * Banner: inline feedback with an × that dismisses it. Banners sit inside forms (sign-in, the
 * invoke panel), where a button without a type submits the form, so dismissing must never submit.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SyntheticEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import Banner from '../Banner';

describe('Banner', () => {
  it('shows an error by default and a success on request', () => {
    const { container, rerender } = render(<Banner onClose={vi.fn()}>Nope</Banner>);
    expect(container.querySelector('.error-box.closable')).toHaveTextContent('Nope');
    rerender(
      <Banner isError={false} onClose={vi.fn()}>
        Done
      </Banner>,
    );
    expect(container.querySelector('.success-box.closable')).toHaveTextContent('Done');
  });

  it('calls onClose when dismissed', async () => {
    const onClose = vi.fn();
    render(<Banner onClose={onClose}>Nope</Banner>);
    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is a plain button, so dismissing inside a form does not submit it', async () => {
    const onSubmit = vi.fn((event: SyntheticEvent) => {
      event.preventDefault();
    });
    const onClose = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Banner onClose={onClose}>Nope</Banner>
      </form>,
    );
    expect(screen.getByTitle('Dismiss')).toHaveAttribute('type', 'button');
    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
