// @vitest-environment jsdom
/*
 * CreateChatbot: lists the chat models, loads the personas on first touch of the form, starts the
 * crawl only for a non-blank URL, hands the chosen settings to createBot once the progress
 * channel listens, and offers the finished chatbot (open / edit) when the crawl announces it.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import CreateChatbot from '../CreateChatbot';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

interface FeedbackMessage {
  type: string;
  message: string;
}

interface FeedbackProps {
  title: string;
  channel: string;
  onReady: () => void;
  onClose: () => void;
  isComplete?: (message: FeedbackMessage) => boolean;
  renderDone?: (messages: FeedbackMessage[]) => React.ReactNode;
}

// The messages the stubbed progress channel has delivered.
const feedback = vi.hoisted(() => ({ messages: [] as FeedbackMessage[] }));

vi.mock('../../SocketFeedback', () => ({
  default: (props: Readonly<FeedbackProps>) => (
    <div>
      <span>{props.title}</span>
      <span data-testid="channel">{props.channel}</span>
      <button onClick={props.onReady}>listening</button>
      <button onClick={props.onClose}>stop watching</button>
      {props.isComplete && feedback.messages.some(props.isComplete)
        ? props.renderDone?.(feedback.messages)
        : null}
    </div>
  ),
}));

let toasts: Toast[];

const PERSONAS = [
  { name: 'Friendly', description: 'Warm and chatty', prefix: 'PREFIX-F', instruction: 'FILL-F' },
  { name: 'Formal', prefix: 'PREFIX-X', instruction: 'FILL-X' },
];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  feedback.messages = [];
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.openaiModels).mockResolvedValue([
    { id: 'gpt-chat', chat: true, input_price: 1, output_price: 2 },
    { id: 'gpt-mini', chat: true },
    { id: 'embedder', chat: false },
  ]);
  vi.mocked(api.openaiSystemMessages).mockResolvedValue(PERSONAS);
  vi.mocked(api.createBot).mockResolvedValue({} as never);
  vi.mocked(api.backendInfo).mockReturnValue({ url: 'https://cloudlet.test//', token: 't' });
});

afterEach(() => {
  setToastListener(null);
});

function renderWizard() {
  const onTour = vi.fn();
  render(
    <MemoryRouter>
      <CreateChatbot onTour={onTour} />
    </MemoryRouter>,
  );
  return { onTour };
}

function urlField() {
  return screen.getByPlaceholderText('https://example.com');
}

async function startCrawl(url = 'https://example.com') {
  await userEvent.type(urlField(), url);
  await userEvent.click(screen.getByRole('button', { name: 'Create chatbot' }));
}

describe('CreateChatbot form', () => {
  it('opens the tour from the help link', async () => {
    const { onTour } = renderWizard();

    await userEvent.click(screen.getByRole('button', { name: 'What do these fields do?' }));

    expect(onTour).toHaveBeenCalled();
  });

  it('keeps Create disabled until a URL has been typed', async () => {
    renderWizard();
    const create = screen.getByRole('button', { name: 'Create chatbot' });
    expect(create).toBeDisabled();

    await userEvent.type(urlField(), '   ');
    expect(create).toBeDisabled();

    await userEvent.type(urlField(), 'https://example.com');
    expect(create).toBeEnabled();
  });

  it('does not start a crawl when the form is submitted with a blank URL', () => {
    renderWizard();

    fireEvent.submit(urlField().closest('form')!);

    expect(screen.queryByText(/Creating a chatbot from/)).toBeNull();
  });

  it('loads the personas once, on the first touch of the form, and describes the first', async () => {
    renderWizard();
    expect(api.openaiSystemMessages).not.toHaveBeenCalled();

    await userEvent.click(urlField());
    await userEvent.click(screen.getByLabelText(/Max pages/));

    expect(api.openaiSystemMessages).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Warm and chatty')).toBeInTheDocument();
  });

  it('shows no description for a persona that has none', async () => {
    renderWizard();
    await userEvent.click(urlField());
    await screen.findByText('Warm and chatty');

    await userEvent.click(screen.getByText('Friendly'));
    await userEvent.click(await screen.findByRole('option', { name: 'Formal' }));

    expect(screen.queryByText('Warm and chatty')).toBeNull();
  });

  it('copes with a persona list and a model list that are empty or fail', async () => {
    vi.mocked(api.openaiModels).mockResolvedValue(undefined as never);
    vi.mocked(api.openaiSystemMessages).mockResolvedValue(undefined as never);
    renderWizard();

    await userEvent.click(urlField());

    await waitFor(() => expect(api.openaiSystemMessages).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Create chatbot' })).toBeDisabled();
  });

  it('ignores a failure to load the models or the personas', async () => {
    vi.mocked(api.openaiModels).mockRejectedValue(new Error('no models'));
    vi.mocked(api.openaiSystemMessages).mockRejectedValue(new Error('no personas'));
    renderWizard();

    await userEvent.click(urlField());

    await waitFor(() => expect(api.openaiSystemMessages).toHaveBeenCalled());
    expect(toasts).toEqual([]);
    expect(screen.getByRole('heading', { name: 'Chatbot Wizard' })).toBeInTheDocument();
  });
});

describe('CreateChatbot crawl', () => {
  it('opens the progress window on the URL and starts the bot once it is listening', async () => {
    renderWizard();
    await userEvent.click(urlField());
    await screen.findByText('Warm and chatty');

    await startCrawl('  https://example.com  ');
    expect(screen.getByText(/Creating a chatbot from/)).toBeInTheDocument();
    expect(api.createBot).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'listening' }));

    expect(api.createBot).toHaveBeenCalledWith({
      url: 'https://example.com',
      model: 'gpt-6-luna',
      flavor: 'PREFIX-F',
      instruction: 'FILL-F',
      max: 25,
      autoDestruct: true,
      channel: screen.getByTestId('channel').textContent,
    });
    expect(screen.getByTestId('channel').textContent).toMatch(/^create-bot-\d+$/);
  });

  it('sends the chosen model, page limit and auto-destruct setting', async () => {
    renderWizard();

    await userEvent.click(
      within(screen.getByText('OpenAI model').closest('label')!).getByRole('button'),
    );
    await userEvent.click(await screen.findByRole('option', { name: /gpt-chat.*\$1\.00 in/ }));
    const pages = screen.getByLabelText(/Max pages/);
    await userEvent.clear(pages);
    await userEvent.type(pages, '40');
    await userEvent.click(screen.getByLabelText(/Delete after 7 days/));
    await startCrawl();
    await userEvent.click(screen.getByRole('button', { name: 'listening' }));

    expect(api.createBot).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-chat',
        max: 40,
        autoDestruct: false,
      }),
    );
  });

  it('sends an empty persona when the personas have not arrived yet', async () => {
    vi.mocked(api.openaiSystemMessages).mockReturnValue(new Promise(() => {}));
    renderWizard();

    await startCrawl();
    await userEvent.click(screen.getByRole('button', { name: 'listening' }));

    expect(api.createBot).toHaveBeenCalledWith(
      expect.objectContaining({ flavor: '', instruction: '' }),
    );
  });

  it('falls back to 25 pages when the limit is blank', async () => {
    renderWizard();
    await userEvent.clear(screen.getByLabelText(/Max pages/));

    await startCrawl();
    await userEvent.click(screen.getByRole('button', { name: 'listening' }));

    expect(api.createBot).toHaveBeenCalledWith(expect.objectContaining({ max: 25 }));
  });

  it('shows why the bot could not be created', async () => {
    vi.mocked(api.createBot).mockRejectedValue(new Error('Quota exceeded'));
    renderWizard();

    await startCrawl();
    await userEvent.click(screen.getByRole('button', { name: 'listening' }));

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'Quota exceeded', isError: true }),
    );
  });

  it('cannot start a second crawl while one is open, and can again after it is closed', async () => {
    renderWizard();
    await startCrawl();

    expect(screen.getByRole('button', { name: 'Create chatbot' })).toBeDisabled();
    fireEvent.submit(urlField().closest('form')!);
    expect(screen.getAllByText(/Creating a chatbot from/)).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'stop watching' }));

    expect(screen.queryByText(/Creating a chatbot from/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Create chatbot' })).toBeEnabled();
  });
});

describe('CreateChatbot result', () => {
  it('offers no links before the crawl is done', async () => {
    feedback.messages = [{ type: 'information', message: 'Crawling…' }];
    renderWizard();

    await startCrawl();

    expect(screen.queryByRole('link', { name: /Open chatbot/ })).toBeNull();
  });

  it('offers the finished chatbot and its model page once the crawl says Done!', async () => {
    feedback.messages = [
      { type: 'information', message: 'Creating a landing page for acme-bot' },
      { type: 'information', message: ' Done! ' },
    ];
    renderWizard();

    await startCrawl();

    const open = screen.getByRole('link', { name: /Open chatbot/ });
    expect(open).toHaveAttribute('href', 'https://cloudlet.test/acme-bot');
    expect(open).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Edit model' })).toHaveAttribute(
      'href',
      '/machine-learning?edit=acme-bot',
    );
  });

  it('falls back to the vectorised model name when the landing page is not announced', async () => {
    feedback.messages = [
      { type: 'information', message: "Vectorised model 'acme model'" },
      { type: 'information', message: 'Done!' },
    ];
    renderWizard();

    await startCrawl();

    expect(screen.getByRole('link', { name: 'Edit model' })).toHaveAttribute(
      'href',
      '/machine-learning?edit=acme%20model',
    );
  });

  it('shows nothing when the crawl is done but never named the chatbot', async () => {
    feedback.messages = [{ type: 'information', message: 'Done!' }];
    renderWizard();

    await startCrawl();

    expect(screen.queryByRole('link', { name: /Open chatbot/ })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Edit model' })).toBeNull();
  });
});
