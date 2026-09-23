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

import { ReactNode, useEffect, useRef, useState } from 'react';
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

export default function Menu(props: { items: MenuItem[]; title: string }) {

  const [open, setOpen] = useState(false);
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
      className="select-menu designer-menu"
      role="menu"
      style={{ position: 'fixed', top: rect.bottom + 4, right: window.innerWidth - rect.right }}>
      {props.items.map((item, index) => item.heading !== undefined ? (
        <li key={index} className="designer-menu-heading">{item.heading}</li>
      ) : (
        <li
          key={index}
          role="menuitem"
          title={item.hint}
          className={'select-option' +
            (item.checked ? ' selected' : '') +
            (item.disabled ? ' disabled' : '')}
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
        className="btn btn-secondary btn-small"
        title={props.title}
        aria-haspopup="menu"
        aria-expanded={open}
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
