/*
 * App-wide replacement for window.confirm / window.prompt.
 * useDialog() gives promise-based confirm() and prompt() that render as
 * styled modals instead of native alerts.
 */

import {
  ReactNode,
  SubmitEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { showToast } from '../lib/toast';
import {
  type ChoiceOptions,
  type ConfirmOptions,
  DialogContext,
  type FormOptions,
  type PromptOptions,
  type TypedConfirmOptions,
} from '../lib/useDialog';

export type {
  ChoiceButton,
  ChoiceOptions,
  ConfirmOptions,
  FormField,
  FormOptions,
  PromptOptions,
  TypedConfirmOptions,
} from '../lib/useDialog';

type DialogOptions = ConfirmOptions & PromptOptions & Partial<FormOptions> & Partial<ChoiceOptions>;

// Each kind of dialog settles its promise with its own kind of answer.
type ActiveDialog = { options: DialogOptions } & (
  | { kind: 'confirm'; resolve: (value: boolean) => void }
  | { kind: 'prompt' | 'choice'; resolve: (value: string | null) => void }
  | { kind: 'form'; resolve: (value: Record<string, string> | null) => void }
);

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
export function Modal(
  props: Readonly<{
    onClose: () => void;
    // When set, Enter pressed inside a plain <input> confirms the dialog — the
    // carriage-return behaviour every text field is expected to have. Textareas,
    // the code editor, buttons and custom Selects are left alone, since they are
    // not <input> elements and handle Enter themselves.
    onSubmit?: () => void;
    width?: number;
    children: ReactNode;
  }>,
) {
  const [id] = useState(() => Symbol('modal'));
  const [zIndex] = useState(() => OVERLAY_BASE_Z + ++modalSeq);
  const boxRef = useRef<HTMLDivElement>(null);
  // Through a ref so the mount-only effects below never see a stale closure.
  const onCloseRef = useRef(props.onClose);
  useLayoutEffect(() => {
    onCloseRef.current = props.onClose;
  });

  useEffect(() => {
    modalStack.push(id);
    return () => {
      const index = modalStack.indexOf(id);
      if (index !== -1) {
        modalStack.splice(index, 1);
      }
    };
  }, [id]);

  /*
   * Focus lives inside the dialog while it is open, and goes back to
   * whatever opened it when it closes — without this, Tab walks out into
   * the inert page behind the overlay.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    // The field marked data-initial-focus gets focus, else the dialog box
    // itself — unless something inside already claimed it.
    const box = boxRef.current;
    if (box && !box.contains(document.activeElement)) {
      (box.querySelector<HTMLElement>('[data-initial-focus]') ?? box).focus();
    }
    return () => opener?.focus();
  }, []);

  function trapTab(event: React.KeyboardEvent) {
    if (event.key !== 'Tab' || !boxRef.current) {
      return;
    }
    const focusable = [
      ...boxRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
          'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1) ?? first;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || modalStack.at(-1) !== id) {
        return;
      }
      /*
       * CodeMirror handles Escape for its autocomplete popup, its search
       * panel and for fullscreen mode, but lets the event keep bubbling —
       * so while any is up, Escape belongs to the editor rather than to us.
       * Same for an open date-picker popover. This runs in the capture
       * phase, while all of them are still in the DOM to be seen.
       */
      if (
        document.querySelector(
          '.cm-tooltip-autocomplete, .cm-fullscreen, .cm-panel.cm-search, .dtp-pop',
        )
      ) {
        return;
      }
      onCloseRef.current();
    };
    globalThis.addEventListener('keydown', handler, true);
    return () => globalThis.removeEventListener('keydown', handler, true);
  }, [id]);

  return (
    <div
      className="overlay"
      role="presentation"
      style={{ zIndex }}
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
      /*
       * Key events from inside the dialog bubble up to here — the Tab trap and
       * Enter-to-submit are delegated handlers, not the overlay's own.
       */
      onKeyDown={event => {
        trapTab(event);
        const target = event.target as HTMLElement;
        if (
          props.onSubmit &&
          event.key === 'Enter' &&
          !event.shiftKey &&
          target.tagName === 'INPUT' &&
          // An input inside a nested <form> (e.g. the AiPrompt bar) owns its
          // own Enter — don't hijack it to confirm the whole dialog.
          !target.closest('form')
        ) {
          event.preventDefault();
          props.onSubmit();
        }
      }}
    >
      <div
        ref={boxRef}
        className="modal-box"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={props.width ? { width: props.width, maxWidth: '90vw' } : undefined}
      >
        {props.children}
      </div>
    </div>
  );
}

const BUTTON_CLASSES: Record<string, string> = { primary: 'btn', danger: 'btn btn-danger' };

export function DialogProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [draft, setDraft] = useState('');
  const [formDraft, setFormDraft] = useState<Record<string, string>>({});

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>(resolve => setActive({ kind: 'confirm', options, resolve })),
    [],
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>(resolve => {
        setDraft(options.initial ?? '');
        setActive({ kind: 'prompt', options, resolve });
      }),
    [],
  );

  /*
   * Deleting something irreversible follows the old dashboard's rule of
   * having the user type its name back before anything happens.
   */
  const confirmTyped = useCallback(
    async (options: TypedConfirmOptions) => {
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
    },
    [prompt],
  );

  /*
   * A prompt that suggests a value selects it as it opens, so typing replaces
   * the suggestion outright while leaving it there for anyone who wants to
   * keep or edit it. The callback identity is stable so React runs it once, on
   * mount — an inline one would re-select the text on every keystroke.
   */
  const selectSuggestion = useCallback((input: HTMLInputElement | null) => {
    input?.select();
  }, []);

  const form = useCallback(
    (options: FormOptions) =>
      new Promise<Record<string, string> | null>(resolve => {
        setFormDraft({});
        setActive({ kind: 'form', options, resolve });
      }),
    [],
  );

  const choice = useCallback(
    (options: ChoiceOptions) =>
      new Promise<string | null>(resolve => setActive({ kind: 'choice', options, resolve })),
    [],
  );

  function dismiss() {
    if (!active) {
      return;
    }
    if (active.kind === 'confirm') {
      active.resolve(false);
    } else {
      active.resolve(null);
    }
    setActive(null);
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    switch (active!.kind) {
      case 'confirm':
        active!.resolve(true);
        break;
      case 'prompt':
        active!.resolve(draft);
        break;
      case 'form':
        active!.resolve(formDraft);
        break;
    }
    setActive(null);
  }

  const dialogs = useMemo(
    () => ({ confirm, confirmTyped, prompt, form, choice }),
    [confirm, confirmTyped, prompt, form, choice],
  );

  return (
    <DialogContext.Provider value={dialogs}>
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
                  onChange={event => setDraft(event.target.value)}
                />
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
                      type={
                        /^(u?int|u?long|u?short|decimal|double|float)$/.test(field.type ?? '')
                          ? 'number'
                          : 'text'
                      }
                      required={field.mandatory ?? false}
                      value={formDraft[field.name] ?? ''}
                      onChange={event =>
                        setFormDraft({ ...formDraft, [field.name]: event.target.value })
                      }
                    />
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
                    className={BUTTON_CLASSES[button.kind as string] ?? 'btn btn-secondary'}
                    onClick={() => {
                      active.resolve(button.value);
                      setActive(null);
                    }}
                  >
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
                    className={'btn' + (active.options.danger ? ' btn-danger' : '')}
                  >
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
