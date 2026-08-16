/*
 * Rewind — steps through a recorded execution.
 *
 * Every entry is one slot invocation, and carries the entire lambda object as
 * it looked immediately afterwards. So moving through the list is watching the
 * program's own state evolve, rather than reading a stack trace and guessing.
 */

import { useEffect, useRef, useState } from 'react';
import CodeEditor from './CodeEditor';
import { Modal } from './Dialogs';
import type { DebugRecording } from '../lib/api';

export default function DebugDialog(props: {
  filename: string;
  recording: DebugRecording;
  onClose: () => void;
}) {

  const steps = props.recording.steps ?? [];
  const error = props.recording.error;

  // Opening at the beginning, since stepping forward is how the story reads.
  const [index, setIndex] = useState(0);
  const current = steps[index];

  /*
   * Arrow keys step, which is what anyone reaching for a scrubber tries first.
   * Up and left both go back and down and right both go forward, since the list
   * reads vertically while the scrubber reads horizontally, and guessing wrong
   * about which mental model someone has is worse than accepting either.
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      /*
       * The scrubber is itself a range input and moves on arrow keys, so keys it
       * handles are left alone - stepping here as well would move two at a time.
       */
      if (e.target instanceof HTMLInputElement) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex(i => Math.min(steps.length - 1, i + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const total = steps.reduce((sum, step) => sum + (step.elapsed ?? 0), 0);

  /*
   * The recorder writes its entry in a finally block, so when an execution threw
   * the statement that threw is the last one recorded.
   */
  const errorIndex = error ? steps.length - 1 : -1;

  // Keeping the current step on screen, since stepping quickly outruns the list.
  const currentRow = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    currentRow.current?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  return (
    <Modal width={1080} onClose={props.onClose}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0 }}>
        Rewind
        <span className="muted mono" style={{ fontSize: 14, fontWeight: 400 }}>
          {props.filename}
        </span>
      </h2>
      {steps.length === 0 ? (
        <div className="info-box">
          Nothing was recorded. The lambda invoked no slots.
        </div>
      ) : (
        <>
          <div className="toolbar" style={{ marginBottom: 10 }}>
            <span className="muted">
              {steps.length} step{steps.length === 1 ? '' : 's'} · {total} ms
            </span>
            {error && (
              <button
                className="badge badge-error"
                style={{ border: 0, cursor: 'pointer' }}
                title={error.type + ' — click to jump to the statement that threw'}
                onClick={() => setIndex(errorIndex)}>
                {error.message}
              </button>
            )}
            {props.recording.returned !== undefined
              && props.recording.returned !== null && (
              <span className="badge badge-get" title={preview(props.recording.returned, 400)}>
                returned {preview(props.recording.returned, 40)}
              </span>
            )}
            <span className="spacer" />
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}>
              ‹ Prev
            </button>
            <span className="mono">{index + 1} / {steps.length}</span>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setIndex(i => Math.min(steps.length - 1, i + 1))}
              disabled={index >= steps.length - 1}>
              Next ›
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={index}
            onChange={e => setIndex(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 12 }}
            aria-label="Execution step" />

          {/*
            * Explicit widths rather than the shared editor-split, whose
            * "flex: 1 on every child" rule collapses the editor pane to zero
            * width - and a CodeMirror with no width paints nothing at all.
            */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

            {/* The steps themselves, newest work at the bottom, as they ran. */}
            <div
              className="card"
              style={{ padding: 0, overflow: 'auto', maxHeight: 460, flex: '0 0 300px' }}>
              <table className="compact-table debug-steps">
                <thead>
                  <tr>
                    <th style={{ width: 42 }}>#</th>
                    <th>Slot</th>
                    <th style={{ width: 60 }}>ms</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, idx) => (
                    <tr
                      key={idx}
                      ref={idx === index ? currentRow : undefined}
                      className={'clickable'
                        + (idx === index ? ' current' : '')
                        + (idx === errorIndex ? ' failed' : '')}
                      onClick={() => setIndex(idx)}>
                      <td className="mono muted">{idx + 1}</td>
                      <td className="mono">{step.slot}</td>
                      <td className="mono muted">{step.elapsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* The whole lambda, as it looked after the selected step ran. */}
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                The whole lambda after step {index + 1},
                {' '}<span className="mono">{current.slot}</span>
              </div>
              <CodeEditor
                value={current.lambda ?? ''}
                mode="hyperlambda"
                readOnly
                lineNumbers={false}
                highlightLine={verifiedLine(current.lambda ?? '', current.path, current.slot)}
                highlightClass={index === errorIndex ? 'cm-error-step' : 'cm-current-step'}
                height="420px" />
            </div>
          </div>
        </>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * A returned value is as often a list of database rows as it is a scalar, and
 * String() renders those as "[object Object]" - so structures are summarised by
 * shape instead, with the full JSON available on hover.
 */
function preview(value: any, max: number) {
  if (Array.isArray(value)) {
    return value.length + (value.length === 1 ? ' item' : ' items');
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value).slice(0, max);
  }
  return String(value).slice(0, max);
}

/*
 * Resolves the executing node's index path into a line of the rendered
 * Hyperlambda, by walking the indentation one level per index.
 *
 * A value spanning several lines would throw the indentation off, so the line
 * found is only accepted when the name on it is the slot that actually ran -
 * highlighting nothing is fine, highlighting the wrong statement is not.
 */
function verifiedLine(lambda: string, path: string, slot: string) {
  const line = lineOfPath(lambda, path);
  if (line < 0) {
    return -1;
  }
  const name = (lambda.split('\n')[line] ?? '').trim().split(':')[0];
  return name === slot ? line : -1;
}

function lineOfPath(lambda: string, path: string) {
  if (!path) {
    return -1;
  }
  const lines = lambda.split('\n');
  const targets = path.split('.').map(Number);
  let cursor = 0;
  let depth = 0;
  let found = -1;
  for (const target of targets) {
    let seen = -1;
    let matched = false;
    for (; cursor < lines.length; cursor++) {
      const raw = lines[cursor];
      if (raw.trim() === '') {
        continue;
      }
      const indent = (raw.length - raw.replace(/^ +/, '').length) / 3;
      if (indent < depth) {
        break;
      }
      if (indent === depth) {
        seen += 1;
        if (seen === target) {
          found = cursor;
          cursor += 1;
          depth += 1;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      return -1;
    }
  }
  return found;
}
