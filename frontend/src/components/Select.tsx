/*
 * A lean, dependency-free dropdown that replaces the native <select> (whose
 * option list is an un-themable OS control on macOS). It keeps the same authoring
 * shape — pass <option> children — but renders a themed menu into a portal so it
 * is never clipped by a card or modal. Keyboard: Up/Down/Enter/Escape, plus
 * type-ahead by first letter.
 */
import {
  Children, isValidElement, ReactNode, useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';

interface Opt {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  // Plain-text form of the label, for type-ahead matching.
  text: string;
}

function collectOptions(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.forEach(children, (child: any) => {
    if (!isValidElement(child)) return;
    if (child.type === 'option') {
      const label = (child.props as any).children;
      out.push({
        value: String((child.props as any).value ?? ''),
        label,
        disabled: (child.props as any).disabled,
        text: typeof label === 'string' ? label : String((child.props as any).value ?? ''),
      });
    } else if ((child.props as any)?.children) {
      out.push(...collectOptions((child.props as any).children));
    }
  });
  return out;
}

export default function Select(props: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {

  const options = useMemo(() => collectOptions(props.children), [props.children]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ str: '', at: 0 });

  const selected = options.find(o => o.value === props.value);

  function place() {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }

  function openMenu() {
    if (props.disabled) return;
    place();
    setActive(options.findIndex(o => o.value === props.value));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  function choose(value: string) {
    props.onChange(value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function move(dir: number) {
    let i = active;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) break;
    }
    setActive(i);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (props.disabled) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' || (e.key === ' ' && !open)) {
      e.preventDefault();
      if (open && active >= 0) choose(options[active].value);
      else openMenu();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { openMenu(); return; }
      move(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    // Type-ahead — jump to the next option whose label starts with the typed run.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current.str = now - typed.current.at < 800 ? typed.current.str + e.key : e.key;
      typed.current.at = now;
      const q = typed.current.str.toLowerCase();
      const hit = options.findIndex(o => !o.disabled && o.text.toLowerCase().startsWith(q));
      if (hit >= 0) {
        if (open) setActive(hit);
        else choose(options[hit].value);
      }
    }
  }

  return (
    <div
      className={'select' + (props.disabled ? ' disabled' : '') + (props.className ? ' ' + props.className : '')}
      style={props.style}>
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger"
        disabled={props.disabled}
        title={props.title}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}>
        <span className="select-value">
          {selected ? selected.label : (props.placeholder ?? '')}
        </span>
        <span className="select-caret" aria-hidden="true">▾</span>
      </button>
      {open && rect && createPortal(
        <ul
          ref={menuRef}
          className="select-menu"
          role="listbox"
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}>
          {options.map((o, i) => (
            <li
              key={o.value + '·' + i}
              role="option"
              aria-selected={o.value === props.value}
              className={'select-option'
                + (o.value === props.value ? ' selected' : '')
                + (i === active ? ' active' : '')
                + (o.disabled ? ' disabled' : '')}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => !o.disabled && choose(o.value)}>
              <span className="select-check" aria-hidden="true">{o.value === props.value ? '✓' : ''}</span>
              <span className="select-option-label">{o.label}</span>
            </li>
          ))}
        </ul>,
        document.body)}
    </div>
  );
}
