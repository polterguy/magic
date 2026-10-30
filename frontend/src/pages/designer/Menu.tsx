/*
 * The toolbar's overflow menu.
 *
 * The toolbar had grown to nine controls and started wrapping onto a second
 * row, which pushed Save — the one thing that must never be hunted for — below
 * the fold. So only what is reached for constantly stays on the bar: the page,
 * the view, undo and save. Everything occasional lives in here.
 *
 * Built on the same portal-and-outside-click shape as the dashboard's Select,
 * and wearing its classes, so it is the same object the rest of the app uses
 * rather than a second kind of dropdown.
 */

import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MenuIcon } from '../../components/Icons';

export interface MenuItem {
  // A heading above a run of items, rather than an item itself.
  heading?: string;
  label?: string;
  // Rendered with a tick, for options and toggles.
  checked?: boolean;
  disabled?: boolean;
  hint?: string;
  onClick?: () => void;
}

export default function Menu(props: Readonly<{ items: MenuItem[]; title: string; className?: string }>) {

  const [open, setOpen] = useState(false);
  // The item the keyboard is on, or -1 for none.
  const [active, setActive] = useState(-1);
  const menuId = useId();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  function place() {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const reposition = () => place();
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActive(-1);
    }
  }, [open]);

  const selectable = (index: number) => {
    const item = props.items[index];
    return item.heading === undefined && !item.disabled && !!item.onClick;
  };

  // The next selectable item in the given direction, wrapping round, or -1 when there is none.
  function step(from: number, direction: 1 | -1) {
    const count = props.items.length;
    let index = from;
    for (let n = 0; n < count; n++) {
      index = (index + direction + count) % count;
      if (selectable(index)) {
        return index;
      }
    }
    return -1;
  }

  /*
   * Keyboard lives on the trigger, which keeps focus while the menu is open,
   * exactly as the dashboard's Select does.
   */
  function onKeyDown(event: ReactKeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!open) {
        place();
        setOpen(true);
        setActive(step(direction === 1 ? -1 : 0, direction));
        return;
      }
      setActive(step(active, direction));
    } else if (open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActive(event.key === 'Home' ? step(-1, 1) : step(0, -1));
    } else if (open && active >= 0 && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      choose(props.items[active]);
    }
  }

  function choose(item: MenuItem) {
    if (item.disabled || !item.onClick) {
      return;
    }
    item.onClick();
    /*
     * Toggles stay open. Checking "show hidden" and then wanting the phone
     * width is one errand, and closing between them makes it two.
     */
    if (item.checked === undefined) {
      setOpen(false);
    }
  }

  const menu: ReactNode = open && rect ? createPortal(
    <ul
      ref={menuRef}
      id={menuId}
      className="select-menu designer-menu"
      role="menu"
      style={{ position: 'fixed', top: rect.bottom + 4, right: window.innerWidth - rect.right }}>
      {props.items.map((item, index) => item.heading !== undefined ? (
        <li key={index} className="designer-menu-heading">{item.heading}</li>
      ) : (
        <li
          key={index}
          id={menuId + '-' + index}
          role="menuitem"
          title={item.hint}
          className={'select-option' +
            (item.checked ? ' selected' : '') +
            (index === active ? ' active' : '') +
            (item.disabled ? ' disabled' : '')}
          onMouseEnter={() => selectable(index) && setActive(index)}
          onMouseDown={event => event.preventDefault()}
          onClick={() => choose(item)}>
          <span className="select-check" aria-hidden="true">{item.checked ? '✓' : ''}</span>
          <span className="select-option-label">{item.label}</span>
        </li>
      ))}
    </ul>,
    document.body) : null;

  return (
    <>
      <button
        ref={triggerRef}
        className={props.className ?? 'btn btn-secondary btn-small'}
        title={props.title}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open && active >= 0 ? menuId + '-' + active : undefined}
        onKeyDown={onKeyDown}
        onClick={() => {
          place();
          setOpen(current => !current);
        }}>
        <MenuIcon />
      </button>
      {menu}
    </>
  );
}
