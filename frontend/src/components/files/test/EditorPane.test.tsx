// @vitest-environment jsdom
/*
 * EditorPane: shows the open tabs and either the editor and AI prompt for the selected file or an
 * empty-state hint, wires the editor's save, execute, selection and action callbacks to the file
 * hooks, focuses a newly attached editor once, and feeds the AI prompt the file's context.
 */
import type { EditorView } from '@codemirror/view';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setToastListener, type Toast } from '../../../lib/toast';
import EditorPane from '../EditorPane';
import type { Execution } from '../hooks/useExecution';
import type { FileOperations } from '../hooks/useFileOperations';
import type { OpenTabs } from '../hooks/useOpenTabs';
import type { TabActions } from '../hooks/useTabActions';

interface EditorProps {
  value: string;
  mode: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onExecute: () => void;
  undoableEditId?: number;
  onHelp?: (selection: string) => void;
  onInstance: (instance: EditorView) => void;
  onSelectionChange: (hasSelection: boolean) => void;
  onAction: (action: string) => void;
}

interface PromptProps {
  fileType: string;
  getContext: () => string | undefined;
  getOldCode: () => string;
  session: string;
  onResult: (snippet: string) => void;
  onError: (message: string) => void;
}

const ACTIONS = [
  'newFile',
  'newFolder',
  'renameFile',
  'deleteFile',
  'deleteFolder',
  'close',
  'nextTab',
  'previousTab',
  'unknown',
];

vi.mock('../../CodeEditor', () => ({
  default: (props: Readonly<EditorProps>) => (
    <div data-testid="editor" data-mode={props.mode} data-undo={props.undoableEditId}>
      <span data-testid="value">{props.value}</span>
      <span data-testid="help">{props.onHelp ? 'help' : 'no help'}</span>
      <button onClick={() => props.onChange('changed')}>type</button>
      <button onClick={props.onSave}>save</button>
      <button onClick={props.onExecute}>execute</button>
      <button onClick={() => props.onSelectionChange(true)}>select</button>
      <button onClick={() => props.onInstance(editors.first)}>attach first</button>
      <button onClick={() => props.onInstance(editors.second)}>attach second</button>
      {ACTIONS.map(action => (
        <button key={action} onClick={() => props.onAction(action)}>
          action {action}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../AiPrompt', () => ({
  default: (props: Readonly<PromptProps>) => (
    <div data-testid="prompt" data-type={props.fileType} data-session={props.session}>
      <span data-testid="context">{String(props.getContext())}</span>
      <span data-testid="old-code">{props.getOldCode()}</span>
      <button onClick={() => props.onResult('generated')}>generate</button>
      <button onClick={() => props.onError('model unavailable')}>fail</button>
    </div>
  ),
}));

const editors = vi.hoisted(() => {
  const focusFirst = vi.fn();
  const focusSecond = vi.fn();
  return {
    focusFirst,
    focusSecond,
    first: { focus: focusFirst } as unknown as EditorView,
    second: { focus: focusSecond } as unknown as EditorView,
  };
});

let toasts: Toast[];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
});

function setup(selectedFile: string, content = 'content', open = true) {
  const tabs = {
    openFiles: open ? [{ path: selectedFile || '/a.hl', content, saved: content }] : [],
    selectedFile,
    current: selectedFile ? { path: selectedFile } : undefined,
    content,
    contentEditId: 3,
    updateContent: vi.fn(),
    setSelectedFile: vi.fn(),
    switchTab: vi.fn(),
  };
  const tabActions = { save: vi.fn(), closeFile: vi.fn() };
  const execution = {
    editorRef: { current: null as EditorView | null },
    execute: vi.fn(),
    setHasSelection: vi.fn(),
  };
  const operations = {
    newFile: vi.fn(),
    newFolder: vi.fn(),
    rename: vi.fn(),
    removeFile: vi.fn(),
    removeFolder: vi.fn(),
  };
  render(
    <EditorPane
      tabs={tabs as unknown as OpenTabs}
      tabActions={tabActions as unknown as TabActions}
      execution={execution as unknown as Execution}
      operations={operations as unknown as FileOperations}
      activeFolder="/modules/shop/"
    />,
  );
  return { tabs, tabActions, execution, operations };
}

describe('EditorPane with no file selected', () => {
  it('asks for a file and shows neither editor nor prompt nor tabs', () => {
    setup('', '', false);

    expect(screen.getByText('Select a file in the tree to start editing.')).toBeInTheDocument();
    expect(screen.queryByTestId('editor')).toBeNull();
    expect(screen.queryByTestId('prompt')).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('still shows the tabs of open files', () => {
    setup('', '', true);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('Select a file in the tree to start editing.')).toBeInTheDocument();
  });
});

describe('EditorPane tabs', () => {
  it('selects a tab on click and closes it from its close button', async () => {
    const { tabs, tabActions } = setup('/modules/shop/orders.get.hl');

    await userEvent.click(screen.getByRole('tab'));
    expect(tabs.setSelectedFile).toHaveBeenCalledWith('/modules/shop/orders.get.hl');

    await userEvent.click(screen.getByTitle('Close'));
    expect(tabActions.closeFile).toHaveBeenCalledWith('/modules/shop/orders.get.hl');
  });
});

describe('EditorPane editor', () => {
  it('shows the selected file in a mode that fits it', () => {
    setup('/modules/shop/orders.get.hl', 'lambda');

    expect(screen.getByTestId('editor')).toHaveAttribute('data-mode', 'hyperlambda');
    expect(screen.getByTestId('editor')).toHaveAttribute('data-undo', '3');
    expect(screen.getByTestId('value')).toHaveTextContent('lambda');
  });

  it('offers the help action for Hyperlambda files only', () => {
    setup('/modules/shop/orders.get.hl');
    expect(screen.getByTestId('help')).toHaveTextContent('help');
  });

  it('offers no help action for other files', () => {
    setup('/etc/data/settings.json', '{}');

    expect(screen.getByTestId('editor')).toHaveAttribute('data-mode', 'application/json');
    expect(screen.getByTestId('help')).toHaveTextContent('no help');
  });

  it('passes edits, save, execute and selection changes on', async () => {
    const { tabs, tabActions, execution } = setup('/modules/shop/orders.get.hl');

    await userEvent.click(screen.getByRole('button', { name: 'type' }));
    await userEvent.click(screen.getByRole('button', { name: 'save' }));
    await userEvent.click(screen.getByRole('button', { name: 'execute' }));
    await userEvent.click(screen.getByRole('button', { name: 'select' }));

    expect(tabs.updateContent).toHaveBeenCalledWith('changed');
    expect(tabActions.save).toHaveBeenCalled();
    expect(execution.execute).toHaveBeenCalled();
    expect(execution.setHasSelection).toHaveBeenCalledWith(true);
  });

  it('keeps and focuses a newly attached editor, and only once per instance', async () => {
    const { execution } = setup('/modules/shop/orders.get.hl');

    await userEvent.click(screen.getByRole('button', { name: 'attach first' }));
    expect(execution.editorRef.current).toBe(editors.first);
    expect(editors.focusFirst).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'attach first' }));
    expect(editors.focusFirst).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'attach second' }));
    expect(execution.editorRef.current).toBe(editors.second);
    expect(editors.focusSecond).toHaveBeenCalledTimes(1);
  });

  it('turns the editor shortcuts into file operations on the right target', async () => {
    const { tabs, tabActions, operations } = setup('/modules/shop/orders.get.hl');

    for (const action of ACTIONS) {
      await userEvent.click(screen.getByRole('button', { name: 'action ' + action }));
    }

    expect(operations.newFile).toHaveBeenCalledExactlyOnceWith('/modules/shop/');
    expect(operations.newFolder).toHaveBeenCalledExactlyOnceWith('/modules/shop/');
    expect(operations.rename).toHaveBeenCalledExactlyOnceWith('/modules/shop/orders.get.hl', false);
    expect(operations.removeFile).toHaveBeenCalledExactlyOnceWith('/modules/shop/orders.get.hl');
    expect(operations.removeFolder).toHaveBeenCalledExactlyOnceWith('/modules/shop/');
    expect(tabActions.closeFile).toHaveBeenCalledExactlyOnceWith('/modules/shop/orders.get.hl');
    expect(tabs.switchTab.mock.calls).toEqual([[1], [-1]]);
  });
});

describe('EditorPane AI prompt', () => {
  it('prompts for the file type and sends the code being changed', () => {
    setup('/modules/shop/orders.get.hl', 'lambda');

    expect(screen.getByTestId('prompt')).toHaveAttribute('data-type', 'hl');
    expect(screen.getByTestId('prompt')).toHaveAttribute(
      'data-session',
      '/modules/shop/orders.get.hl',
    );
    expect(screen.getByTestId('old-code')).toHaveTextContent('lambda');
    // Hyperlambda carries no extra system message; the generator knows it already.
    expect(screen.getByTestId('context')).toHaveTextContent('undefined');
  });

  it('frames the existing code as the context for other file types', () => {
    setup('/etc/data/settings.json', '{"a":1}');

    expect(screen.getByTestId('prompt')).toHaveAttribute('data-type', 'json');
    expect(screen.getByTestId('context').textContent).toContain('{"a":1}');
  });

  it('puts the generated snippet into the editor', async () => {
    const { tabs } = setup('/modules/shop/orders.get.hl');

    await userEvent.click(screen.getByRole('button', { name: 'generate' }));

    expect(tabs.updateContent).toHaveBeenCalledWith('generated');
  });

  it('shows an AI error as an error toast', async () => {
    setup('/modules/shop/orders.get.hl');

    await userEvent.click(screen.getByRole('button', { name: 'fail' }));

    expect(toasts.at(-1)).toMatchObject({ text: 'model unavailable', isError: true });
  });
});
