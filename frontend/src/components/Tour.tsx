/*
 * Guided tour — dims the page, spotlights one element at a time, and explains
 * it. Steps name their target through [data-tour]; any step whose element is
 * not currently on screen is dropped, so conditional widgets filter themselves
 * out rather than the tour having to know why they are missing.
 *
 * The spotlight is one transparent box over the target carrying a huge
 * box-shadow, which dims everything except the hole — no clip-path, and the
 * target keeps its own rendering.
 *
 * Nothing but the card takes clicks, so the page stays usable underneath and
 * the reader can act on the very button being pointed at. That also means
 * there is no click-outside-to-dismiss: Skip, Done and Escape close it.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TourStep } from '../lib/tourSteps';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function visibleTarget(step: TourStep): HTMLElement | null {
  if (!step.target) {
    return null;
  }
  const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? element : null;
}

/*
 * [onClose] reports whether the reader saw the tour through — Done on the last
 * step, or an explicit Skip. Escaping out, or a tour with nothing to point at,
 * does not count, so the caller can offer it again.
 */
export default function Tour(props: {
  steps: TourStep[];
  onClose: (completed: boolean) => void;
}) {

  /*
   * Resolved once on open. Re-resolving per render would reshuffle the tour
   * mid-flight when a step's action makes another widget appear.
   */
  const [steps] = useState(
    () => props.steps.filter(step => !step.target || visibleTarget(step)));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];

  const close = useCallback(
    (completed: boolean) => props.onClose(completed), [props]);

  // Nothing to show — a tour with no visible targets should not open at all.
  useEffect(() => {
    if (steps.length === 0) {
      close(false);
    }
  }, [steps.length, close]);

  const measure = useCallback(() => {
    if (!step) {
      return;
    }
    const element = visibleTarget(step);
    if (!element) {
      setRect(null);
      return;
    }
    const box = element.getBoundingClientRect();
    setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
  }, [step]);

  // Bring the target into view, then measure where it landed.
  useLayoutEffect(() => {
    if (!step) {
      return;
    }
    const element = visibleTarget(step);
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    measure();
    const timer = window.setTimeout(measure, 350);
    return () => window.clearTimeout(timer);
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close(false);
      } else if (event.key === 'ArrowRight') {
        setIndex(current => Math.min(current + 1, steps.length - 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, steps.length]);

  if (!step) {
    return null;
  }

  const last = index === steps.length - 1;
  /*
   * Below the target when there is room, above when there is not. Without a
   * target the card sits in the middle of the screen.
   */
  const below = rect ? rect.top + rect.height + 16 : 0;
  const above = rect ? rect.top - 16 : 0;
  const roomBelow = rect ? window.innerHeight - below > 210 : false;
  const cardStyle: React.CSSProperties = rect
    ? {
        top: roomBelow ? below : undefined,
        bottom: roomBelow ? undefined : window.innerHeight - above,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 396)),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/*
        * The dimming normally comes from the spotlight's box-shadow — but a
        * step with no target has no spotlight, so the scrim carries it.
        */}
      <div className={'tour-scrim' + (rect ? '' : ' dim')} />
      {rect && (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }} />
      )}
      <div className="tour-card" style={cardStyle} tabIndex={-1} ref={cardRef}>
        <div className="tour-step-count">Step {index + 1} of {steps.length}</div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button className="btn btn-ghost btn-small" onClick={() => close(true)}>
            Skip
          </button>
          <span style={{ flex: 1 }} />
          <button
            className="btn btn-small"
            onClick={() => (last ? close(true) : setIndex(index + 1))}>
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
