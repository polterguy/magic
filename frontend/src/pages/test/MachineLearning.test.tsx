// @vitest-environment jsdom
/*
 * MachineLearning page: lists the models, warns when OpenAI is not configured, deletes a model
 * after the typed-name confirmation, and opens on the tab a ?tab= deep link names (training data
 * for the model in ?type=).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import MachineLearning from '../MachineLearning';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.mlTypes).mockResolvedValue([
    { type: 'support', model: 'gpt-test', use_embeddings: 1, system_message_token_count: 1234 },
    { type: 'sales', model: 'gpt-other', use_embeddings: 0 },
  ]);
  vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: true });
  vi.mocked(api.mlTypeDelete).mockResolvedValue({} as never);
  vi.mocked(api.mlSnippets).mockResolvedValue([
    { id: 1, type: 'sales', prompt: 'How much does it cost?', completion: 'Ten euros.' },
  ]);
  vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 1 });
  vi.mocked(api.listQuestionnaires).mockResolvedValue([]);
});

describe('MachineLearning', () => {
  it('lists the models', async () => {
    renderPage(<MachineLearning />);

    expect(screen.getByRole('heading', { name: 'Machine Learning' })).toBeInTheDocument();
    const support = (await screen.findByText('support')).closest('tr')!;
    expect(within(support).getByText('gpt-test')).toBeInTheDocument();
    expect(within(support).getByText('1,234')).toBeInTheDocument();
    expect(within(support).getByRole('img', { name: 'Embeddings on' })).toBeInTheDocument();
    expect(screen.getByText('2 models')).toBeInTheDocument();
    expect(screen.queryByText(/OpenAI is not configured/)).not.toBeInTheDocument();
  });

  it('warns when OpenAI is not configured', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
    renderPage(<MachineLearning />);

    expect(await screen.findByText(/OpenAI is not configured/)).toBeInTheDocument();
  });

  it('deletes a model once its name has been typed back', async () => {
    renderPage(<MachineLearning />);
    const sales = (await screen.findByText('sales')).closest('tr')!;

    await userEvent.click(within(sales).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Model name'), 'sales');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(api.mlTypeDelete).toHaveBeenCalledWith('sales'));
  });

  it('opens on the training data of the model a deep link names', async () => {
    renderPage(<MachineLearning />, { route: '/machine-learning?tab=training&type=sales' });

    expect(await screen.findByText('How much does it cost?')).toBeInTheDocument();
    expect(api.mlSnippets).toHaveBeenCalledWith('sales', '', 0, 12, expect.anything(), false);
  });

  it('switches to the questionnaires tab', async () => {
    renderPage(<MachineLearning />);
    await screen.findByText('support');

    await userEvent.click(screen.getByRole('button', { name: 'Questionnaires' }));

    await waitFor(() => expect(api.listQuestionnaires).toHaveBeenCalled());
    expect(screen.queryByText('gpt-test')).not.toBeInTheDocument();
  });
});
