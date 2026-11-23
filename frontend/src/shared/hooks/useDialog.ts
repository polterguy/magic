/*
 * The promise-based confirm()/prompt() dialogs' context and the hook that
 * reads it. DialogProvider (components/Dialogs) renders them; this file is
 * kept apart so that one exports only components, as fast refresh wants.
 */

import { createContext, useContext } from 'react';

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

export const DialogContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmTyped: (options: TypedConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  form: (options: FormOptions) => Promise<Record<string, string> | null>;
  choice: (options: ChoiceOptions) => Promise<string | null>;
}>(null!);

export function useDialog() {
  return useContext(DialogContext);
}
