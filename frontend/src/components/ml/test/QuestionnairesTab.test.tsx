// @vitest-environment jsdom
/*
 * QuestionnairesTab: the master/detail editor for questionnaires and their questions — listing and
 * selection, the empty state, creating (name rule) and editing questionnaires, deleting with the
 * typed-name confirmation, and adding, editing and deleting questions.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import QuestionnairesTab from '../QuestionnairesTab';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

let toasts: Toast[];

const QUESTIONNAIRES: api.Questionnaire[] = [
  { name: 'intake', type: 'single-shot', action: 'notify' },
  { name: 'survey', type: 'recurring', action: null },
];

const INTAKE_QUESTIONS: api.Question[] = [
  {
    question_id: 1,
    question: 'What is your name?',
    questionnaire: 'intake',
    type: 'question',
    context: 1,
    name: 'who',
  },
  {
    question_id: 2,
    question: 'Welcome aboard',
    questionnaire: 'intake',
    type: 'message',
    context: 0,
    name: null,
  },
];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.listQuestionnaires).mockResolvedValue(QUESTIONNAIRES);
  vi.mocked(api.listQuestions).mockImplementation(name =>
    Promise.resolve(name === 'intake' ? INTAKE_QUESTIONS : []),
  );
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function renderTab() {
  render(
    <DialogProvider>
      <QuestionnairesTab />
    </DialogProvider>,
  );
  await screen.findByText('What is your name?');
}

function rowOf(text: string) {
  return screen.getByText(text).closest('tr') as HTMLElement;
}

// Opens a Select by the text it currently shows and picks one of its options.
async function pick(current: string, option: string) {
  await userEvent.click(screen.getByText(current, { selector: '.select-value' }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('QuestionnairesTab listing', () => {
  it('lists the questionnaires and shows the first one with its questions', async () => {
    await renderTab();
    expect(screen.getByText('2 questionnaires')).toBeInTheDocument();
    expect(api.listQuestions).toHaveBeenCalledWith('intake');
    expect(screen.getByRole('heading', { name: 'intake' })).toBeInTheDocument();
    expect(screen.getByText('intake', { selector: 'strong' }).closest('tr')).toHaveClass(
      'row-selected',
    );
    expect(screen.getByText('Welcome aboard')).toBeInTheDocument();
    expect(screen.getByText('who')).toBeInTheDocument();
    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('shows another questionnaire on click, with a hint when it has no questions', async () => {
    await renderTab();
    await userEvent.click(screen.getByText('survey'));
    expect(await screen.findByText(/No questions yet/)).toBeInTheDocument();
    expect(api.listQuestions).toHaveBeenCalledWith('survey');
    expect(screen.queryByText('What is your name?')).not.toBeInTheDocument();
  });

  it('explains the empty state', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue([]);
    render(
      <DialogProvider>
        <QuestionnairesTab />
      </DialogProvider>,
    );
    expect(await screen.findByText(/No questionnaires yet/)).toBeInTheDocument();
    expect(screen.getByText('0 questionnaires')).toBeInTheDocument();
  });

  it('shows the error when the list cannot be loaded', async () => {
    vi.mocked(api.listQuestionnaires).mockRejectedValueOnce(new Error('offline'));
    render(
      <DialogProvider>
        <QuestionnairesTab />
      </DialogProvider>,
    );
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'offline', isError: true }));
    expect(await screen.findByText(/No questionnaires yet/)).toBeInTheDocument();
  });

  it('shows the error when the questions cannot be loaded', async () => {
    vi.mocked(api.listQuestions).mockRejectedValueOnce(new Error('no questions for you'));
    render(
      <DialogProvider>
        <QuestionnairesTab />
      </DialogProvider>,
    );
    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'no questions for you', isError: true }),
    );
    expect(await screen.findByText(/No questions yet/)).toBeInTheDocument();
  });
});

describe('QuestionnairesTab questionnaires', () => {
  it('creates a questionnaire and selects it', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ New questionnaire' }));
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Name', { exact: false }), 'feedback');
    await pick('single-shot', 'recurring');
    await userEvent.type(screen.getByLabelText('Action (optional)'), 'mail');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(api.createQuestionnaire).toHaveBeenCalled());
    expect(api.createQuestionnaire).toHaveBeenCalledWith({
      name: 'feedback',
      type: 'recurring',
      action: 'mail',
    });
    expect(toasts.at(-1)).toMatchObject({ text: 'Questionnaire feedback created', isError: false });
    await waitFor(() => expect(api.listQuestions).toHaveBeenCalledWith('feedback'));
    expect(screen.queryByText('New questionnaire')).not.toBeInTheDocument();
  });

  it('rejects names that break the rule and sends no action when it is empty', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ New questionnaire' }));
    const name = screen.getByLabelText('Name', { exact: false });
    for (const bad of ['a', 'Upper', 'has space', 'x'.repeat(21)]) {
      await userEvent.clear(name);
      await userEvent.type(name, bad);
      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    }
    await userEvent.clear(name);
    await userEvent.type(name, 'ok_name-1');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(api.createQuestionnaire).toHaveBeenCalled());
    expect(api.createQuestionnaire).toHaveBeenCalledWith({
      name: 'ok_name-1',
      type: 'single-shot',
      action: null,
    });
  });

  it('creates on Enter only when the name is valid', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ New questionnaire' }));
    const name = screen.getByLabelText('Name', { exact: false });
    await userEvent.type(name, 'x{Enter}');
    expect(api.createQuestionnaire).not.toHaveBeenCalled();
    await userEvent.type(name, 'y{Enter}');
    await waitFor(() => expect(api.createQuestionnaire).toHaveBeenCalled());
  });

  it('shows the error and keeps the dialog when creating fails', async () => {
    vi.mocked(api.createQuestionnaire).mockRejectedValueOnce(new Error('exists'));
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ New questionnaire' }));
    await userEvent.type(screen.getByLabelText('Name', { exact: false }), 'intake');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'exists', isError: true }));
    expect(screen.getByText('New questionnaire')).toBeInTheDocument();
  });

  it('cancels creating', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ New questionnaire' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('New questionnaire')).not.toBeInTheDocument();
    expect(api.createQuestionnaire).not.toHaveBeenCalled();
  });

  it('edits a questionnaire without being able to rename it, and does not select its row', async () => {
    await renderTab();
    await userEvent.click(within(rowOf('survey')).getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit survey')).toBeInTheDocument();
    expect(screen.getByLabelText('Name', { exact: false })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'intake' })).toBeInTheDocument();

    await pick('recurring', 'single-shot');
    await userEvent.type(screen.getByLabelText('Action (optional)'), 'hook');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.updateQuestionnaire).toHaveBeenCalled());
    expect(api.updateQuestionnaire).toHaveBeenCalledWith({
      name: 'survey',
      type: 'single-shot',
      action: 'hook',
    });
    expect(toasts.at(-1)).toMatchObject({ text: 'Questionnaire survey saved' });
  });

  it('deletes only after the name is typed back', async () => {
    await renderTab();
    await userEvent.click(within(rowOf('survey')).getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete questionnaire?')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name'), 'survey');
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);

    await waitFor(() => expect(api.deleteQuestionnaire).toHaveBeenCalledWith('survey'));
    expect(toasts.at(-1)).toMatchObject({ text: 'survey deleted' });
    await waitFor(() => expect(api.listQuestionnaires).toHaveBeenCalledTimes(2));
  });

  it('deletes nothing when the typed name does not match', async () => {
    await renderTab();
    await userEvent.click(within(rowOf('survey')).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Name'), 'surve');
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(api.deleteQuestionnaire).not.toHaveBeenCalled();
  });

  it('deletes nothing when the confirmation is cancelled', async () => {
    await renderTab();
    await userEvent.click(within(rowOf('survey')).getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(api.deleteQuestionnaire).not.toHaveBeenCalled();
  });

  it('shows the error when deleting fails', async () => {
    vi.mocked(api.deleteQuestionnaire).mockRejectedValueOnce(new Error('in use'));
    await renderTab();
    await userEvent.click(within(rowOf('survey')).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Name'), 'survey');
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'in use', isError: true }));
  });
});

describe('QuestionnairesTab questions', () => {
  it('adds a question to the selected questionnaire', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ Add question' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Question'), 'Your email?');
    await userEvent.type(screen.getByLabelText('Name (optional)'), 'email');
    await userEvent.click(screen.getByLabelText('Remember'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.createQuestion).toHaveBeenCalled());
    expect(api.createQuestion).toHaveBeenCalledWith({
      question: 'Your email?',
      questionnaire: 'intake',
      type: 'question',
      name: 'email',
      context: 1,
    });
    await waitFor(() => expect(api.listQuestions).toHaveBeenCalledTimes(2));
  });

  it('disables name and remember for a message', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ Add question' }));
    expect(screen.getByText(/the chatbot waits for the user/)).toBeInTheDocument();
    await pick('question', 'message');
    expect(screen.getByText(/then the chatbot moves straight on/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name (optional)')).toBeDisabled();
    expect(screen.getByLabelText('Remember')).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Question'), 'Hello there');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.createQuestion).toHaveBeenCalled());
    expect(api.createQuestion).toHaveBeenCalledWith({
      question: 'Hello there',
      questionnaire: 'intake',
      type: 'message',
      name: null,
      context: 0,
    });
  });

  it('edits a question in place', async () => {
    await renderTab();
    await userEvent.click(
      within(rowOf('What is your name?')).getByRole('button', { name: 'Edit' }),
    );
    expect(screen.getByText('Edit question')).toBeInTheDocument();
    expect(screen.getByLabelText('Question')).toHaveValue('What is your name?');
    expect(screen.getByLabelText('Remember')).toBeChecked();
    await userEvent.type(screen.getByLabelText('Question'), ' really');
    await userEvent.clear(screen.getByLabelText('Name (optional)'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.updateQuestion).toHaveBeenCalled());
    expect(api.updateQuestion).toHaveBeenCalledWith({
      question_id: 1,
      question: 'What is your name? really',
      questionnaire: 'intake',
      type: 'question',
      name: null,
      context: 1,
    });
  });

  it('saves a question on Enter in a text field only when it has text', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ Add question' }));
    await userEvent.type(screen.getByLabelText('Name (optional)'), 'n{Enter}');
    expect(api.createQuestion).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Question'), 'Q');
    await userEvent.type(screen.getByLabelText('Name (optional)'), '{Enter}');
    await waitFor(() => expect(api.createQuestion).toHaveBeenCalled());
  });

  it('shows the error and keeps the dialog when saving a question fails', async () => {
    vi.mocked(api.createQuestion).mockRejectedValueOnce(new Error('bad question'));
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ Add question' }));
    await userEvent.type(screen.getByLabelText('Question'), 'Q');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'bad question', isError: true }),
    );
    expect(screen.getByText('Add question')).toBeInTheDocument();
  });

  it('cancels the question dialog', async () => {
    await renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ Add question' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Add question')).not.toBeInTheDocument();
  });

  it('deletes a question after confirming and reloads the list', async () => {
    await renderTab();
    await userEvent.click(within(rowOf('Welcome aboard')).getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete question?')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);
    await waitFor(() => expect(api.deleteQuestion).toHaveBeenCalledWith(2));
    await waitFor(() => expect(api.listQuestions).toHaveBeenCalledTimes(2));
  });

  it('keeps the question when the delete is declined', async () => {
    await renderTab();
    await userEvent.click(within(rowOf('Welcome aboard')).getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(api.deleteQuestion).not.toHaveBeenCalled();
  });

  it('shows the error when deleting a question fails', async () => {
    vi.mocked(api.deleteQuestion).mockRejectedValueOnce(new Error('locked'));
    await renderTab();
    await userEvent.click(within(rowOf('Welcome aboard')).getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'locked', isError: true }));
  });
});
