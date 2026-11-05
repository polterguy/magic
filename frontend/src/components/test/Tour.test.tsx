// @vitest-environment jsdom
/*
 * Tour: steps whose [data-tour] target is not visible are dropped, the spotlight
 * and card appear for a targeted step, a target-less step gets a centred card,
 * and Next / Done / Skip / Escape / ArrowRight report the right completion flag.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { TourStep } from '../../lib/tourSteps';
import Tour from '../Tour';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // jsdom has no layout: give anything carrying data-tour a box, everything else none.
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const sized = this.hasAttribute('data-tour');
    return {
      top: 40,
      left: 60,
      right: sized ? 160 : 60,
      bottom: sized ? 80 : 40,
      width: sized ? 100 : 0,
      height: sized ? 40 : 0,
      x: 60,
      y: 40,
      toJSON: () => ({}),
    };
  };
});

afterEach(() => {
  document.body.innerHTML = '';
});

const STEPS: TourStep[] = [
  { title: 'Welcome', body: 'Hello there' },
  { target: 'alpha', title: 'Alpha thing', body: 'About alpha' },
  { target: 'missing', title: 'Ghost', body: 'Not on screen' },
  { target: 'beta', title: 'Beta thing', body: 'About beta' },
];

// The targets are mounted first, as on a real page: the tour resolves its steps once, on open.
function renderTour(steps: TourStep[] = STEPS) {
  const onClose = vi.fn();
  const { rerender } = render(
    <>
      <div data-tour="alpha">A</div>
      <div data-tour="beta">B</div>
    </>,
  );
  rerender(
    <>
      <div data-tour="alpha">A</div>
      <div data-tour="beta">B</div>
      <Tour steps={steps} onClose={onClose} />
    </>,
  );
  return { onClose };
}

describe('Tour', () => {
  it('drops steps whose target is not on screen', () => {
    renderTour();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('shows a centred, dimmed card for a step without a target', () => {
    renderTour();
    expect(document.querySelector('.tour-spotlight')).toBeNull();
    expect(document.querySelector('.tour-scrim')).toHaveClass('dim');
    expect(document.querySelector('.tour-card')).toHaveStyle({ top: '50%', left: '50%' });
  });

  it('spotlights the target of the next step', async () => {
    renderTour();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Alpha thing')).toBeInTheDocument();
    expect(screen.getByText('About alpha')).toBeInTheDocument();
    const spotlight = document.querySelector('.tour-spotlight');
    expect(spotlight).toHaveStyle({ top: '34px', left: '54px', width: '112px', height: '52px' });
    expect(document.querySelector('.tour-scrim')).not.toHaveClass('dim');
  });

  it('shows Done on the last step and reports completion', async () => {
    const { onClose } = renderTour();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Beta thing')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('counts Skip as completed', async () => {
    const { onClose } = renderTour();
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('counts Escape as not completed', async () => {
    const { onClose } = renderTour();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('advances on ArrowRight but never past the last step', async () => {
    renderTour();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Beta thing')).toBeInTheDocument();
  });

  it('closes as not completed, rendering nothing, when no step has a visible target', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Tour steps={[{ target: 'nope', title: 'x', body: 'y' }]} onClose={onClose} />,
    );
    expect(onClose).toHaveBeenCalledWith(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('is a labelled modal dialog', () => {
    renderTour();
    expect(screen.getByRole('dialog', { name: 'Guided tour' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });
});
