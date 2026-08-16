/*
 * App-wide replacement for window.confirm / window.prompt.
 * useDialog() gives promise-based confirm() and prompt() that render as
 * styled modals instead of native alerts.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  FormEvent,
  ReactNode,
} from 'react';
import { showToast } from '../lib/toast';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  danger?: boolean;
}

export interface TypedConfirmOptions {
  title: string;
  message: string;
  // Label of the input, e.g. "Username" or "Table name".
  label: string;
  // The name the user must type back before the action runs.
  expected: string;
  confirmText?: string;
  // Toast shown when the typed name doesn't match.
  mismatch?: string;
}

export interface PromptOptions {
  title: string;
  message?: string;
  label?: string;
  initial?: string;
  password?: boolean;
  confirmText?: string;
}

export interface FormField {
  name: string;
  type?: string;
  mandatory?: boolean;
}

export interface FormOptions {
  title: string;
  message?: string;
  fields: FormField[];
  confirmText?: string;
}

export interface ChoiceButton {
  label: string;
  value: string;
  kind?: 'primary' | 'secondary' | 'danger';
}

export interface ChoiceOptions {
  title: string;
  message?: string;
  buttons: ChoiceButton[];
}

interface ActiveDialog {
  kind: 'confirm' | 'prompt' | 'form' | 'choice';
  options: ConfirmOptions & PromptOptions & Partial<FormOptions> & Partial<ChoiceOptions>;
  resolve: (value: any) => void;
}

const DialogContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmTyped: (options: TypedConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  form: (options: FormOptions) => Promise<Record<string, string> | null>;
  choice: (options: ChoiceOptions) => Promise<string | null>;
}>(null!);

// Stack of open modals so Escape only closes the topmost one.
const modalStack: symbol[] = [];

/*
 * Stacking follows the order modals were OPENED, not the order they happen to
 * sit in the JSX — a dialog opened from inside another must cover it, and the
 * page has no say in which of its modal blocks it wrote first.
 *
 * The counter only ever climbs. Resetting it when the last modal closes looks
 * tidier but breaks under StrictMode, whose mount/unmount/remount empties the
 * stack mid-flight and hands two live modals the same z-index. Climbing costs
 * nothing: z-index runs to 2147483647, and this moves by one per modal opened.
 */
const OVERLAY_BASE_Z = 100;
let modalSeq = 0;

/*
 * Shared modal shell — every dialog in the app renders through this, so
 * Escape and backdrop-click always close.
 */
export function Modal(props: {
  onClose: () => void;
  // When set, Enter pressed inside a plain <input> confirms the dialog — the
  // carriage-return behaviour every text field is expected to have. Textareas,
  // the code editor, buttons and custom Selects are left alone, since they are
  // not <input> elements and handle Enter themselves.
  onSubmit?: () => void;
  width?: number;
  /*
   * Off for dialogs that are expensive to lose — the invoke form holds typed
   * arguments, and closing it by reflex after dismissing a result on top of it
   * throws that work away. Those dialogs close through their own controls.
   */
  closeOnEscape?: boolean;
  children: ReactNode;
}) {

  const idRef = useRef(Symbol('modal'));
  const [zIndex] = useState(() => OVERLAY_BASE_Z + ++modalSeq);
  const boxRef = useRef<HTMLDivElement>(null);
  // Through a ref so the mount-only effects below never see a stale closure.
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  useEffect(() => {
    modalStack.push(idRef.current);
    return () => {
      const index = modalStack.indexOf(idRef.current);
      if (index !== -1) {
        modalStack.splice(index, 1);
      }
    };
  }, []);

  /*
   * Focus lives inside the dialog while it is open, and goes back to
   * whatever opened it when it closes — without this, Tab walks out into
   * the inert page behind the overlay.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    // Fields with autoFocus have already claimed focus by now — only move
    // it when nothing inside the dialog took it.
    if (boxRef.current && !boxRef.current.contains(document.activeElement)) {
      boxRef.current.focus();
    }
    return () => opener?.focus();
  }, []);

  function trapTab(event: React.KeyboardEvent) {
    if (event.key !== 'Tab' || !boxRef.current) {
      return;
    }
    const focusable = boxRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const escapeRef = useRef(props.closeOnEscape);
  escapeRef.current = props.closeOnEscape;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' ||
          modalStack[modalStack.length - 1] !== idRef.current ||
          escapeRef.current === false) {
        return;
      }
      /*
       * CodeMirror handles Escape for its autocomplete popup, its search
       * dialog and for fullscreen mode, but lets the event keep bubbling —
       * so while any is up, Escape belongs to the editor rather than to us.
       * Same for an open date-picker popover. This runs in the capture
       * phase, while all of them are still in the DOM to be seen.
       */
      if (document.querySelector(
          '.CodeMirror-hints, .CodeMirror-fullscreen, .CodeMirror-dialog, .dtp-pop')) {
        return;
      }
      onCloseRef.current();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  return (
    <div
      className="overlay"
      style={{ zIndex }}
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}>
      <div
        ref={boxRef}
        className="modal-box"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={props.width ? { width: props.width, maxWidth: '90vw' } : undefined}
        onKeyDown={event => {
          trapTab(event);
          const target = event.target as HTMLElement;
          if (props.onSubmit &&
              event.key === 'Enter' &&
              !event.shiftKey &&
              target.tagName === 'INPUT' &&
              // An input inside a nested <form> (e.g. the AiPrompt bar) owns its
              // own Enter — don't hijack it to confirm the whole dialog.
              !target.closest('form')) {
            event.preventDefault();
            props.onSubmit();
          }
        }}>
        {props.children}
      </div>
    </div>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: ReactNode }) {

  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [draft, setDraft] = useState('');
  const [formDraft, setFormDraft] = useState<Record<string, string>>({});

  const confirm = useCallback((options: ConfirmOptions) =>
    new Promise<boolean>(resolve =>
      setActive({ kind: 'confirm', options, resolve })), []);

  /*
   * Deleting something irreversible follows the old dashboard's rule of
   * having the user type its name back before anything happens.
   */
  const confirmTyped = useCallback(async (options: TypedConfirmOptions) => {
    const typed = await prompt({
      title: options.title,
      message: options.message,
      label: options.label,
      confirmText: options.confirmText ?? 'Delete',
    });
    if (typed === null) {
      return false;
    }
    if (typed !== options.expected) {
      showToast(options.mismatch ?? 'Name did not match — nothing deleted', true);
      return false;
    }
    return true;
  }, []);

  const prompt = useCallback((options: PromptOptions) =>
    new Promise<string | null>(resolve => {
      setDraft(options.initial ?? '');
      setActive({ kind: 'prompt', options, resolve });
    }), []);

  /*
   * A prompt that suggests a value selects it as it opens, so typing replaces
   * the suggestion outright while leaving it there for anyone who wants to
   * keep or edit it. The callback identity is stable so React runs it once, on
   * mount — an inline one would re-select the text on every keystroke.
   */
  const selectSuggestion = useCallback((input: HTMLInputElement | null) => {
    input?.select();
  }, []);

  const form = useCallback((options: FormOptions) =>
    new Promise<Record<string, string> | null>(resolve => {
      setFormDraft({});
      setActive({ kind: 'form', options, resolve });
    }), []);

  const choice = useCallback((options: ChoiceOptions) =>
    new Promise<string | null>(resolve =>
      setActive({ kind: 'choice', options, resolve })), []);

  function dismiss() {
    if (!active) {
      return;
    }
    active.resolve(active.kind === 'confirm' ? false : null);
    setActive(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    switch (active!.kind) {
      case 'confirm': active!.resolve(true); break;
      case 'prompt': active!.resolve(draft); break;
      case 'form': active!.resolve(formDraft); break;
    }
    setActive(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, confirmTyped, prompt, form, choice }}>
      {children}
      {active && (
        <Modal onClose={dismiss}>
          <form onSubmit={submit}>
            <h2>{active.options.title}</h2>
            {active.options.message && <p>{active.options.message}</p>}
            {active.kind === 'prompt' && (
              <label className="modal-label">
                {active.options.label}
                <input
                  autoFocus
                  ref={selectSuggestion}
                  type={active.options.password ? 'password' : 'text'}
                  // Keeps the browser from autofilling saved credentials into
                  // a prompt that merely happens to mask its input.
                  autoComplete={active.options.password ? 'new-password' : 'off'}
                  value={draft}
                  onChange={event => setDraft(event.target.value)} />
              </label>
            )}
            {active.kind === 'form' && (
              <div style={{ maxHeight: '55vh', overflow: 'auto' }}>
                {active.options.fields!.map((field, index) => (
                  <label className="modal-label" key={field.name}>
                    <span>
                      {field.name}
                      <span className="muted" style={{ fontWeight: 400 }}>
                        {' — ' + (field.type ?? 'string')}
                        {field.mandatory ? ', mandatory' : ''}
                      </span>
                    </span>
                    <input
                      autoFocus={index === 0}
                      type={/^(u?int|u?long|u?short|decimal|double|float)$/.test(field.type ?? '')
                        ? 'number'
                        : 'text'}
                      required={field.mandatory ?? false}
                      value={formDraft[field.name] ?? ''}
                      onChange={event =>
                        setFormDraft({ ...formDraft, [field.name]: event.target.value })} />
                  </label>
                ))}
              </div>
            )}
            <div className="modal-actions">
              {active.kind === 'choice' ? (
                active.options.buttons!.map(button => (
                  <button
                    key={button.value}
                    type="button"
                    className={
                      button.kind === 'primary' ? 'btn' :
                      button.kind === 'danger' ? 'btn btn-danger' :
                      'btn btn-secondary'}
                    onClick={() => { active.resolve(button.value); setActive(null); }}>
                    {button.label}
                  </button>
                ))
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={dismiss}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={'btn' + (active.options.danger ? ' btn-danger' : '')}>
                    {active.options.confirmText ?? 'OK'}
                  </button>
                </>
              )}
            </div>
          </form>
        </Modal>
      )}
    </DialogContext.Provider>
  );
}
