/*
 * How the selected element looks.
 *
 * Every change has to answer one question first: change this one element, or
 * change everything that looks like it? So the panel asks it outright. "This
 * element" writes an inline style and touches nothing else. Picking one of the
 * page's own selectors edits every element that matches, through the block the
 * designer owns at the end of the stylesheet.
 *
 * A free-text value is applied when you leave the field, not while you type.
 * Applying per keystroke means half-typed values reach the element — and since
 * CSS keeps only what is already valid, "12p" on the way to "12px" stores
 * nothing, which blanks the field and makes the control impossible to type
 * into. Here what you type is yours until you leave the field; then it is
 * either valid and applied, or invalid and marked, and either way it is never
 * quietly rewritten.
 */

import { useState } from 'react';
import { Overrides } from './css';
import { STYLE_GROUPS, toHexColor } from './properties';

/*
 * The "just this one" target. A leading colon cannot collide with a real
 * selector here, because selectors carrying a pseudo-class are never offered.
 */
export const INLINE = ':this-element';

/*
 * Whether CSS accepts this value for this property, asked of the browser
 * rather than answered with rules of our own. The browser is the authority on
 * its own syntax, it covers every property at once, and it cannot drift from
 * what the canvas will actually do with the value.
 */
const probe = document.createElement('div');

function isValid(property: string, value: string) {
  if (value.trim() === '') {
    return true;
  }
  probe.style.removeProperty(property);
  probe.style.setProperty(property, value);
  return probe.style.getPropertyValue(property) !== '';
}

export default function Styles(props: {
  element: Element | null;
  // The canvas frame's window, for asking what the browser resolved a
  // property to — which needs the frame's own layout, not the dashboard's.
  frameWindow: Window | null;
  selectors: string[];
  target: string;
  overrides: Overrides;
  stylesheet: string | null;
  // True when a run of text is selected and these styles belong to its parent.
  onText: boolean;
  // The page's stylesheets that are not on this cloudlet, when none could be
  // read. The page renders unstyled here because it renders unstyled anywhere.
  missing: string[];
  onTarget: (target: string) => void;
  onSet: (property: string, value: string) => void;
}) {

  /*
   * What has been typed but not yet committed, and what it was typed against.
   * Carrying the element and target means moving the selection discards the
   * draft rather than leaking it onto the next element.
   */
  const [draft, setDraft] = useState<{
    owner: Element | null;
    target: string;
    values: Record<string, string>;
    invalid: string[];
  }>({ owner: null, target: INLINE, values: {}, invalid: [] });

  const element = props.element;
  if (!element) {
    return <p className="designer-empty">Nothing selected.</p>;
  }
  const computed = props.frameWindow?.getComputedStyle(element) ?? null;
  const mine = draft.owner === element && draft.target === props.target;
  const typed = mine ? draft.values : {};
  const invalid = mine ? draft.invalid : [];

  function update(values: Record<string, string>, flagged: string[]) {
    setDraft({ owner: element, target: props.target, values, invalid: flagged });
  }

  // Typing changes nothing but the field, and clears any mark on it.
  function type(property: string, value: string) {
    update({ ...typed, [property]: value }, invalid.filter(name => name !== property));
  }

  /*
   * Leaving the field is what commits it. An invalid value stays in the field,
   * marked, and is not applied — the page is never changed to something other
   * than what was asked for.
   */
  function commit(property: string) {
    if (!(property in typed)) {
      return;
    }
    const value = typed[property];
    if (isValid(property, value)) {
      update(typed, invalid.filter(name => name !== property));
      props.onSet(property, value.trim());
    } else if (!invalid.includes(property)) {
      update(typed, [...invalid, property]);
    }
  }

  // A menu or a colour picker cannot produce an invalid value, so it applies
  // as soon as it changes — there is nothing to wait for.
  function pick(property: string, value: string) {
    update({ ...typed, [property]: value }, invalid.filter(name => name !== property));
    props.onSet(property, value);
  }

  function clear(property: string) {
    const values = { ...typed };
    delete values[property];
    update(values, invalid.filter(name => name !== property));
    props.onSet(property, '');
  }

  /*
   * What the user has actually set here, as opposed to what the page resolves
   * to. Only this is written back, so only this is shown as a real value.
   */
  function explicit(property: string) {
    if (property in typed) {
      return typed[property];
    }
    if (props.target === INLINE) {
      return (element as HTMLElement).style.getPropertyValue(property);
    }
    return props.overrides[props.target]?.[property] ?? '';
  }

  function resolved(property: string) {
    return computed?.getPropertyValue(property) ?? '';
  }

  return (
    <div className="designer-fields">
      <label className="designer-field">
        <span>Change</span>
        <select value={props.target} onChange={event => props.onTarget(event.target.value)}>
          <option value={INLINE}>This element only</option>
          {props.selectors.map(selector => (
            <option key={selector} value={selector}>
              Everything matching {selector}
            </option>
          ))}
        </select>
      </label>
      {props.target !== INLINE && props.stylesheet && (
        <p className="designer-note">
          Saved to <code>{props.stylesheet}</code>, below the Web Designer marker
          at the end of the file. Nothing above it is touched.
        </p>
      )}
      {props.target === INLINE && (
        <p className="designer-note">
          Saved as a style attribute on this one element.
        </p>
      )}
      {props.onText && (
        <p className="designer-note">
          A run of text has no styles of its own, so these belong to the
          <code> {element.tagName.toLowerCase()} </code> around it.
        </p>
      )}
      {props.missing.length > 0 && (
        <p className="designer-note">
          This page links {props.missing.join(' and ')}, which could not be read
          from this cloudlet. That is why it looks unstyled here — a visitor
          sees the same thing. Only inline styles can be edited until the file
          is there.
        </p>
      )}
      {props.missing.length === 0 && !props.stylesheet && (
        <p className="designer-note">
          This page links no stylesheet of its own, so only inline styles can
          be edited.
        </p>
      )}

      {STYLE_GROUPS.map(group => (
        <details key={group.label} className="designer-group" open>
          <summary>{group.label}</summary>
          {group.properties.map(property => {
            const value = explicit(property.name);
            const bad = invalid.includes(property.name);
            return (
              <div className="designer-style" key={property.name}>
                <label title={property.name}>{property.label}</label>
                {property.kind === 'select' ? (
                  <select
                    value={value}
                    onChange={event => pick(property.name, event.target.value)}>
                    <option value="">{resolved(property.name) || 'inherit'}</option>
                    {property.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : property.kind === 'color' ? (
                  <span className="designer-colour">
                    <input
                      type="color"
                      value={toHexColor(value, toHexColor(resolved(property.name)))}
                      onChange={event => pick(property.name, event.target.value)} />
                    <input
                      type="text"
                      className={bad ? 'invalid' : undefined}
                      title={bad ? 'Not a value CSS accepts for ' + property.name : undefined}
                      value={value}
                      placeholder={resolved(property.name)}
                      onChange={event => type(property.name, event.target.value)}
                      onBlur={() => commit(property.name)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          commit(property.name);
                        }
                      }} />
                  </span>
                ) : (
                  <input
                    type="text"
                    className={bad ? 'invalid' : undefined}
                    title={bad ? 'Not a value CSS accepts for ' + property.name : undefined}
                    value={value}
                    placeholder={resolved(property.name)}
                    onChange={event => type(property.name, event.target.value)}
                    onBlur={() => commit(property.name)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        commit(property.name);
                      }
                    }} />
                )}
                {/*
                  * Shown only once the property carries a value. A disabled
                  * control on every row made a live panel look switched off,
                  * and this way its presence tells you at a glance which
                  * properties you have set and which are inherited.
                  */}
                {value ? (
                  <button
                    className="icon-btn designer-clear"
                    title={'Clear ' + property.name}
                    onClick={() => clear(property.name)}>
                    &times;
                  </button>
                ) : (
                  <span className="designer-clear" />
                )}
              </div>
            );
          })}
        </details>
      ))}
    </div>
  );
}
