// @vitest-environment jsdom
/*
 * EditModelDialog: the create/edit model dialog. Save is gated on a name and an LLM, the payload
 * carries the old-dashboard defaults for a new model and the stored values for an existing one,
 * fields that do nothing under the current retrieval settings are disabled, and the large system
 * instruction editor can apply templates (static and DYNAMIC) and add AI function declarations.
 * The code editor and the two nested dialogs are stubbed.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import EditModelDialog from '../EditModelDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../CodeEditor', async () => ({
  default: (await import('../../../test/CodeEditorStub')).default,
}));

vi.mock('../AddFunctionDialog', () => ({
  default: (
    props: Readonly<{
      type: string;
      onClose: () => void;
      onInstalled: () => void;
      onDeclaration?: (file: string) => void;
    }>,
  ) => (
    <div>
      <span>Add function for {props.type}</span>
      <button onClick={() => props.onDeclaration?.('/misc/workflows/hello.hl')}>Pick hello</button>
      <button onClick={() => props.onDeclaration?.('/misc/workflows/bye.hl')}>Pick bye</button>
      <button onClick={props.onInstalled}>Installed</button>
      <button onClick={props.onClose}>Close function dialog</button>
    </div>
  ),
}));

vi.mock('../../CreateSystemMessageDialog', () => ({
  default: (
    props: Readonly<{
      instruction: string;
      template: string;
      onGenerated: (message: string) => void;
      onClose: () => void;
    }>,
  ) => (
    <div>
      <span>
        Generate from {props.instruction} / {props.template}
      </span>
      <button onClick={() => props.onGenerated('generated message')}>Generated</button>
      <button onClick={props.onClose}>Close generator</button>
    </div>
  ),
}));

let toasts: Toast[];

const MODELS: api.OpenAiModel[] = [
  { id: 'gpt-4o', chat: true, input_price: 2, output_price: 8 },
  { id: 'gpt-mini', chat: true },
  { id: 'whisper', chat: false },
  { id: 'text-embedding-3-small', vector: true },
  { id: 'text-embedding-3-large', vector: true },
];

const FLAVORS: api.SystemMessage[] = [
  {
    name: 'Support',
    prefix: 'You help with YOUR_TYPE_NAME_HERE and YOUR_TYPE_NAME_HERE again',
    max_context_tokens: 3000,
    max_request_tokens: 1500,
    max_function_invocations: 9,
  },
  { name: 'DYNAMIC site', prefix: 'About [[site]]', instruction: 'make it about a site' },
  { name: 'DYNAMIC plain', prefix: 'No placeholders here', instruction: 'x' },
  { name: 'Empty' },
];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.openaiModels).mockResolvedValue(MODELS);
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }, { name: 'admin' }]);
  vi.mocked(api.openaiSystemMessages).mockResolvedValue(FLAVORS);
  vi.mocked(api.openaiCompletionSlots).mockResolvedValue({
    llms: ['magic.ai.chat', 'magic.ai.other'],
  });
  vi.mocked(api.listQuestionnaires).mockResolvedValue([
    { name: 'intake', type: 'support' },
    { name: 'survey', type: 'support' },
  ]);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderDialog(existing: api.MlType | null = null) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <DialogProvider>
      <EditModelDialog existing={existing} onClose={onClose} onSaved={onSaved} />
    </DialogProvider>,
  );
  return { onClose, onSaved };
}

const EXISTING: api.MlType = {
  type: 'support',
  model: 'gpt-4o',
  max_tokens: 1234,
  temperature: 0.7,
  auth: 'root,admin',
  supervised: 0,
  cached: 1,
  use_embeddings: 1,
  threshold: 0.5,
  vector_model: 'text-embedding-3-large',
  max_context_tokens: 2500,
  max_request_tokens: 800,
  retrieval: 'mixed',
  greeting: 'Welcome',
  system_message: 'Be brief',
  base_url: 'https://docs.test',
  conversation_starters: '- hi',
  api_key: 'sk-x',
  no_requests: 4,
  max_requests: 10,
  max_function_invocations: 3,
  max_session_items: 20,
  completion_slot: 'magic.ai.other',
  session_timeout: 600,
  initial_questionnaire: 'intake',
  recaptcha: 0.5,
};

// Opens a Select by the text it currently shows and picks one of its options.
async function pick(current: string, option: string | RegExp) {
  await userEvent.click(screen.getByText(current, { selector: '.select-value' }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

function input(label: string) {
  return screen.getByLabelText<HTMLInputElement>(label, { exact: false });
}

async function nameAndModel(name = 'support') {
  await userEvent.type(input('Type name'), name);
  await pick('Select model…', /^gpt-4o/);
}

async function openEditor() {
  await userEvent.click(screen.getByRole('button', { name: '✎ System instruction' }));
}

describe('EditModelDialog creating', () => {
  it('disables Save until a name of two characters and a model are given', async () => {
    renderDialog();
    expect(screen.getByText('New model')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('title', 'Give the model a name, and select an LLM');

    await userEvent.type(input('Type name'), 'a');
    await pick('Select model…', /^gpt-4o/);
    expect(save).toBeDisabled();

    await userEvent.type(input('Type name'), 'b');
    expect(save).toBeEnabled();
  });

  it('lists only chat models, with their price, and none of the others', async () => {
    renderDialog();
    await userEvent.click(screen.getByText('Select model…', { selector: '.select-value' }));
    expect(
      await screen.findByRole('option', { name: /gpt-4o.*\$2\.00 in \/ \$8\.00 out per 1M/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'gpt-mini' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'whisper' })).not.toBeInTheDocument();
  });

  it('creates the model with the defaults of a new one', async () => {
    const { onSaved } = renderDialog();
    await nameAndModel();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.mlTypeUpdate).not.toHaveBeenCalled();
    expect(api.mlTypeCreate).toHaveBeenCalledWith({
      type: 'support',
      model: 'gpt-4o',
      max_context_tokens: 2000,
      max_request_tokens: 1000,
      max_tokens: 4000,
      temperature: 0.3,
      threshold: 0.3,
      supervised: 1,
      auth: null,
      cached: 0,
      system_message:
        'You are a helpful assistant, and you will answer the users questions ' +
        'based upon the information found in your context',
      greeting: 'Hi there, how can I help you?',
      use_embeddings: 1,
      retrieval: 'embeddings',
      base_url: '',
      conversation_starters: '',
      api_key: null,
      no_requests: 0,
      max_requests: -1,
      max_function_invocations: 5,
      max_session_items: 15,
      completion_slot: 'magic.ai.chat',
      session_timeout: 1200,
      initial_questionnaire: null,
      vector_model: 'text-embedding-3-small',
      recaptcha: 0,
    });
    expect(toasts.at(-1)).toMatchObject({ text: 'Model support saved', isError: false });
  });

  it('saves on Enter in the name field', async () => {
    const { onSaved } = renderDialog();
    await userEvent.type(input('Type name'), 'ab');
    await pick('Select model…', /^gpt-4o/);
    await userEvent.type(input('Type name'), '{Enter}');
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('tells the user what is missing when Enter is pressed too early', async () => {
    const { onSaved } = renderDialog();
    await userEvent.type(input('Type name'), 'ab{Enter}');
    expect(toasts.at(-1)).toMatchObject({
      text: 'Give the model a name, and select an LLM',
      isError: true,
    });
    expect(api.mlTypeCreate).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows the error and stays open when the save fails', async () => {
    vi.mocked(api.mlTypeCreate).mockRejectedValueOnce(new Error('duplicate'));
    const { onSaved } = renderDialog();
    await nameAndModel();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'duplicate', isError: true }));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('still renders when every lookup fails', async () => {
    vi.mocked(api.openaiModels).mockRejectedValueOnce(new Error('x'));
    vi.mocked(api.listRoles).mockRejectedValueOnce(new Error('x'));
    vi.mocked(api.openaiSystemMessages).mockRejectedValueOnce(new Error('x'));
    vi.mocked(api.openaiCompletionSlots).mockRejectedValueOnce(new Error('x'));
    vi.mocked(api.listQuestionnaires).mockRejectedValueOnce(new Error('x'));
    renderDialog();
    expect(screen.getByText('New model')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Select model…', { selector: '.select-value' }));
    expect(await screen.findAllByRole('option')).toHaveLength(1);
  });
});

describe('EditModelDialog editing', () => {
  it('shows the stored values and updates with them', async () => {
    const { onSaved } = renderDialog(EXISTING);
    expect(screen.getByText('Edit support')).toBeInTheDocument();
    expect(screen.queryByLabelText('Type name', { exact: false })).not.toBeInTheDocument();
    expect(input('Greeting').value).toBe('Welcome');
    expect(input('Threshold').value).toBe('0.5');
    expect(screen.getByText('root, admin')).toBeInTheDocument();
    expect(screen.getByLabelText('Supervised')).not.toBeChecked();
    expect(screen.getByLabelText('Cached')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.mlTypeCreate).not.toHaveBeenCalled();
    expect(api.mlTypeUpdate).toHaveBeenCalledWith({
      type: 'support',
      model: 'gpt-4o',
      max_context_tokens: 2500,
      max_request_tokens: 800,
      max_tokens: 1234,
      temperature: 0.7,
      threshold: 0.5,
      supervised: 0,
      auth: 'root,admin',
      cached: 1,
      system_message: 'Be brief',
      greeting: 'Welcome',
      use_embeddings: 1,
      retrieval: 'mixed',
      base_url: 'https://docs.test',
      conversation_starters: '- hi',
      api_key: 'sk-x',
      no_requests: 4,
      max_requests: 10,
      max_function_invocations: 3,
      max_session_items: 20,
      completion_slot: 'magic.ai.other',
      session_timeout: 600,
      initial_questionnaire: 'intake',
      vector_model: 'text-embedding-3-large',
      recaptcha: 0.5,
    });
  });

  it('sends edited general fields as numbers and flags as 0 or 1', async () => {
    renderDialog(EXISTING);
    await userEvent.clear(input('Greeting'));
    await userEvent.type(input('Greeting'), 'Hello!');
    await userEvent.clear(input('Max tokens'));
    await userEvent.type(input('Max tokens'), '999');
    await userEvent.clear(input('Max request tokens'));
    await userEvent.type(input('Max request tokens'), '111');
    await userEvent.clear(input('Max context tokens'));
    await userEvent.type(input('Max context tokens'), '222');
    await userEvent.clear(input('Threshold'));
    await userEvent.type(input('Threshold'), '0.9');
    await userEvent.click(screen.getByLabelText('Supervised'));
    await userEvent.click(screen.getByLabelText('Cached'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        greeting: 'Hello!',
        max_tokens: 999,
        max_request_tokens: 111,
        max_context_tokens: 222,
        threshold: 0.9,
        supervised: 1,
        cached: 0,
      }),
    );
  });

  it('edits the roles the model is restricted to', async () => {
    renderDialog({ ...EXISTING, auth: null });
    expect(screen.getByText('public — no roles')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByLabelText('root'));
    expect(screen.getByText('admin, root')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(expect.objectContaining({ auth: 'root' }));
  });

  it('keeps a model the list does not know selectable', async () => {
    renderDialog({ ...EXISTING, model: 'retired-model' });
    expect(
      await screen.findByText('retired-model', { selector: '.select-value' }),
    ).toBeInTheDocument();
  });

  it('turns the behaviour fields into numbers', async () => {
    renderDialog(EXISTING);
    await userEvent.click(screen.getByRole('button', { name: 'Behaviour' }));
    await userEvent.clear(input('Conversation starters'));
    await userEvent.type(input('Conversation starters'), '- what?');
    await userEvent.clear(input('Max requests'));
    await userEvent.type(input('Max requests'), '-1');
    await userEvent.clear(input('Max function invocations'));
    await userEvent.type(input('Max function invocations'), '7');
    await userEvent.clear(input('Max session items'));
    await userEvent.type(input('Max session items'), '30');
    await userEvent.clear(input('Session timeout'));
    await userEvent.type(input('Session timeout'), '60');
    await userEvent.clear(input('No requests served'));
    await userEvent.type(input('No requests served'), '0');
    await userEvent.clear(input('Captcha'));
    await userEvent.type(input('Captcha'), '-1');
    await pick('magic.ai.other', 'magic.ai.chat');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_starters: '- what?',
        max_requests: -1,
        max_function_invocations: 7,
        max_session_items: 30,
        session_timeout: 60,
        no_requests: 0,
        recaptcha: -1,
        completion_slot: 'magic.ai.chat',
      }),
    );
  });

  it('accepts the bare list older backends answer completion slots with', async () => {
    vi.mocked(api.openaiCompletionSlots).mockResolvedValue(['magic.ai.legacy'] as never);
    renderDialog({ ...EXISTING, completion_slot: 'magic.ai.legacy' });
    await userEvent.click(screen.getByRole('button', { name: 'Behaviour' }));
    expect(
      await screen.findByText('magic.ai.legacy', { selector: '.select-value' }),
    ).toBeInTheDocument();
  });

  it('edits the integration settings and maps no questionnaire to null', async () => {
    renderDialog(EXISTING);
    await userEvent.click(screen.getByRole('button', { name: 'Integrations' }));
    await userEvent.clear(input('Auto-crawl URL'));
    await userEvent.type(input('Auto-crawl URL'), 'https://new.test');
    await userEvent.clear(input('API key override'));
    await pick('intake', 'No questionnaire');
    await pick('Hybrid (mixed)', 'Keyword (BM25)');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        base_url: 'https://new.test',
        api_key: null,
        initial_questionnaire: null,
        retrieval: 'bm25',
      }),
    );
  });

  it('picks another questionnaire and vector model', async () => {
    renderDialog({ ...EXISTING, initial_questionnaire: null });
    await userEvent.click(screen.getByRole('button', { name: 'Integrations' }));
    await pick('No questionnaire', 'survey');
    await pick('text-embedding-3-large', 'text-embedding-3-small');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        initial_questionnaire: 'survey',
        vector_model: 'text-embedding-3-small',
      }),
    );
  });

  it('keeps a questionnaire that has since been deleted', async () => {
    renderDialog({ ...EXISTING, initial_questionnaire: 'gone' });
    await userEvent.click(screen.getByRole('button', { name: 'Integrations' }));
    expect(await screen.findByText('gone', { selector: '.select-value' })).toBeInTheDocument();
  });
});

describe('EditModelDialog retrieval settings', () => {
  it('disables what does nothing without embeddings, and says why', async () => {
    renderDialog(EXISTING);
    await userEvent.click(screen.getByLabelText('Use embeddings'));
    expect(input('Threshold')).toBeDisabled();
    expect(input('Threshold')).toHaveAttribute('title', 'Only used when "Use embeddings" is on');
    expect(input('Max context tokens')).toBeDisabled();
    expect(input('Max context tokens')).toHaveAttribute(
      'title',
      'Only used when "Use embeddings" is on',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Integrations' }));
    const retrieval = screen.getByText('Hybrid (mixed)', { selector: '.select-value' });
    expect(retrieval.closest('button')).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Use embeddings'));
    expect(input('Threshold')).toBeEnabled();
  });

  it('disables the threshold for keyword retrieval, with its own hint', () => {
    renderDialog({ ...EXISTING, retrieval: 'bm25' });
    expect(input('Threshold')).toBeDisabled();
    expect(input('Threshold')).toHaveAttribute(
      'title',
      'Keyword retrieval has no threshold — BM25 rank order decides',
    );
    expect(input('Max context tokens')).toBeEnabled();
  });
});

describe('EditModelDialog system instruction', () => {
  it('opens the large editor, flags the change and saves the new text', async () => {
    renderDialog(EXISTING);
    expect(screen.queryByText(/System instruction changed/)).not.toBeInTheDocument();
    await openEditor();
    expect(screen.getByText('System instruction — support')).toBeInTheDocument();
    const editor = screen.getByLabelText('code editor markdown');
    expect(editor).toHaveValue('Be brief');
    await userEvent.type(editor, ' and kind');
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByLabelText('code editor markdown')).not.toBeInTheDocument();
    expect(
      screen.getByText('System instruction changed — remember to save your model.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ system_message: 'Be brief and kind' }),
    );
  });

  it('names a model that has no name yet', async () => {
    renderDialog();
    await openEditor();
    expect(screen.getByText('System instruction — new model')).toBeInTheDocument();
  });

  it('applies a static template, substituting the type name and the token budgets', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await pick('Apply a template…', 'Support');
    expect(screen.getByLabelText('code editor markdown')).toHaveValue(
      'You help with support and support again',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.mlTypeUpdate).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_context_tokens: 3000,
        max_request_tokens: 1500,
        max_function_invocations: 9,
      }),
    );
  });

  it('uses "default" for a template when the model has no name yet', async () => {
    renderDialog();
    await openEditor();
    await pick('Apply a template…', 'Support');
    expect(screen.getByLabelText('code editor markdown')).toHaveValue(
      'You help with default and default again',
    );
  });

  it('ignores a template without text', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await pick('Apply a template…', 'Empty');
    expect(screen.getByLabelText('code editor markdown')).toHaveValue('Be brief');
  });

  it('hands a DYNAMIC template to the generator and takes its message', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await pick('Apply a template…', 'DYNAMIC site');
    expect(
      screen.getByText('Generate from make it about a site / About [[site]]'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Generated' }));

    expect(screen.queryByText(/Generate from/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('code editor markdown')).toHaveValue('generated message');
  });

  it('closes the generator without changing the message', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await pick('Apply a template…', 'DYNAMIC site');
    await userEvent.click(screen.getByRole('button', { name: 'Close generator' }));
    expect(screen.queryByText(/Generate from/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('code editor markdown')).toHaveValue('Be brief');
  });

  it('inserts a DYNAMIC template without placeholders directly', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await pick('Apply a template…', 'DYNAMIC plain');
    expect(screen.getByLabelText('code editor markdown')).toHaveValue('No placeholders here');
  });

  it('appends AI function declarations under one Functions heading', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await userEvent.click(screen.getByRole('button', { name: '+ AI function' }));
    expect(screen.getByText('Add function for support')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pick hello' }));
    expect(toasts.at(-1)?.text).toBe('AI function added to your system instruction');
    expect(screen.queryByText(/Add function for/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+ AI function' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pick bye' }));

    expect(screen.getByLabelText('code editor markdown')).toHaveValue(
      'Be brief\n\n## Functions\n\nFUNCTION_INVOCATION[/misc/workflows/hello.hl]\n' +
        'FUNCTION_INVOCATION[/misc/workflows/bye.hl]',
    );
  });

  it('closes the function dialog when it reports an install or is dismissed', async () => {
    renderDialog(EXISTING);
    await openEditor();
    await userEvent.click(screen.getByRole('button', { name: '+ AI function' }));
    await userEvent.click(screen.getByRole('button', { name: 'Installed' }));
    expect(screen.queryByText(/Add function for/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ AI function' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close function dialog' }));
    expect(screen.queryByText(/Add function for/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('code editor markdown')).toHaveValue('Be brief');
  });
});
