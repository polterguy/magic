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

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  danger?: boolean;
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
  prompt: (options: PromptOptions) => Promise<string | null>;
  form: (options: FormOptions) => Promise<Record<string, string> | null>;
  choice: (options: ChoiceOptions) => Promise<string | null>;
}>(null!);

// Stack of open modals so Escape only closes the topmost one.
const modalStack: symbol[] = [];

/*
 * Shared modal shell — every dialog in the app renders through this, so
 * Escape and backdrop-click always close.
 */
export function Modal(props: {
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {

  const idRef = useRef(Symbol('modal'));

  useEffect(() => {
    modalStack.push(idRef.current);
    return () => {
      const index = modalStack.indexOf(idRef.current);
      if (index !== -1) {
        modalStack.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' &&
          modalStack[modalStack.length - 1] === idRef.current) {
        props.onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div
      className="overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}>
      <div
        className="modal-box"
        style={props.width ? { width: props.width, maxWidth: '90vw' } : undefined}>
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

  const prompt = useCallback((options: PromptOptions) =>
    new Promise<string | null>(resolve => {
      setDraft(options.initial ?? '');
      setActive({ kind: 'prompt', options, resolve });
    }), []);

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
    <DialogContext.Provider value={{ confirm, prompt, form, choice }}>
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
                  type={active.options.password ? 'password' : 'text'}
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
