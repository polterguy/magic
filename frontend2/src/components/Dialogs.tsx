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

interface ActiveDialog {
  kind: 'confirm' | 'prompt' | 'form';
  options: ConfirmOptions & PromptOptions & Partial<FormOptions>;
  resolve: (value: any) => void;
}

const DialogContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  form: (options: FormOptions) => Promise<Record<string, string> | null>;
}>(null!);

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

  useEffect(() => {
    if (!active) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <DialogContext.Provider value={{ confirm, prompt, form }}>
      {children}
      {active && (
        <div
          className="overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              dismiss();
            }
          }}>
          <form className="modal-box" onSubmit={submit}>
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
              <button type="button" className="btn btn-secondary" onClick={dismiss}>
                Cancel
              </button>
              <button
                type="submit"
                className={'btn' + (active.options.danger ? ' btn-danger' : '')}>
                {active.options.confirmText ?? 'OK'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DialogContext.Provider>
  );
}
