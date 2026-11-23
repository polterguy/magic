// @vitest-environment jsdom
/*
 * Chat Ops in the layout: nothing at all without an OpenAI key, and with one a drawer mounted
 * closed for the signed-in user, a footer button, a palette action and Ctrl/Cmd+. to toggle it,
 * plus the shell actions pages use to open it and to ask it to check the key again.
 */
import * as api from '@shared/api';
import { openChatOps, refreshChat, shellContributions } from '@shared/shell/shellActions';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderPage } from '../../../test/renderPage';
import ChatShell from '../components/ChatShell';

vi.mock('@shared/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../components/ChatDrawer', () => ({
  default: (props: { open: boolean; userId: string; onClose: () => void }) => (
    <div data-testid="chat" data-open={String(props.open)} data-user={props.userId}>
      <button onClick={props.onClose}>close chat</button>
    </div>
  ),
}));

const mocked = vi.mocked(api);

const footerButton = () => shellContributions().footerActions.find(entry => entry.id === 'chat');
const paletteAction = () =>
  shellContributions().paletteActions.find(entry => entry.label === 'Chat with your cloudlet');

beforeEach(() => {
  vi.clearAllMocks();
  mocked.openaiIsConfigured.mockResolvedValue({ result: false });
});

describe('without an OpenAI key', () => {
  it('has no drawer, button, palette action or shortcut', async () => {
    renderPage(<ChatShell />);
    await waitFor(() => expect(mocked.openaiIsConfigured).toHaveBeenCalled());
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
    expect(footerButton()).toBeUndefined();
    expect(paletteAction()).toBeUndefined();
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
  });

  it('stays hidden when the availability check fails', async () => {
    mocked.openaiIsConfigured.mockRejectedValue(new Error('403'));
    renderPage(<ChatShell />);
    await waitFor(() => expect(mocked.openaiIsConfigured).toHaveBeenCalled());
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
  });

  it('appears once a key is added, without reloading the page', async () => {
    renderPage(<ChatShell />);
    await waitFor(() => expect(mocked.openaiIsConfigured).toHaveBeenCalled());
    mocked.openaiIsConfigured.mockResolvedValue({ result: true });
    act(() => refreshChat());
    expect(await screen.findByTestId('chat')).toBeInTheDocument();
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(screen.getByTestId('chat')).toHaveAttribute('data-open', 'true');
  });
});

describe('with an OpenAI key', () => {
  beforeEach(() => {
    mocked.openaiIsConfigured.mockResolvedValue({ result: true });
  });

  /*
   * The drawer renders before the effect that registers its actions has run, so wait for those
   * too — under load a test can otherwise reach for them in between.
   */
  async function ready() {
    const chat = await screen.findByTestId('chat');
    await waitFor(() => expect(footerButton()).toBeDefined());
    return chat;
  }

  it('mounts the drawer closed for the signed-in user, and Ctrl+. and close toggle it', async () => {
    renderPage(<ChatShell />);
    const chat = await ready();
    expect(chat).toHaveAttribute('data-open', 'false');
    expect(chat).toHaveAttribute('data-user', 'root');
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(chat).toHaveAttribute('data-open', 'true');
    await userEvent.keyboard('{Meta>}.{/Meta}');
    expect(chat).toHaveAttribute('data-open', 'false');
    await userEvent.keyboard('{Control>}.{/Control}');
    await userEvent.click(screen.getByRole('button', { name: 'close chat' }));
    expect(chat).toHaveAttribute('data-open', 'false');
  });

  it('adds a footer button that toggles the drawer', async () => {
    renderPage(<ChatShell />);
    const chat = await ready();
    expect(footerButton()?.title).toMatch(/^Chat Ops/);
    act(() => footerButton()!.onClick());
    expect(chat).toHaveAttribute('data-open', 'true');
    act(() => footerButton()!.onClick());
    expect(chat).toHaveAttribute('data-open', 'false');
  });

  it('adds a palette action that opens the drawer', async () => {
    renderPage(<ChatShell />);
    const chat = await ready();
    act(() => paletteAction()!.action());
    expect(chat).toHaveAttribute('data-open', 'true');
  });

  it('lets pages open it through the shell actions', async () => {
    renderPage(<ChatShell />);
    const chat = await ready();
    act(() => openChatOps());
    expect(chat).toHaveAttribute('data-open', 'true');
  });

  it('withdraws everything it added once unmounted', async () => {
    const view = renderPage(<ChatShell />);
    await ready();
    view.unmount();
    expect(footerButton()).toBeUndefined();
    expect(paletteAction()).toBeUndefined();
    expect(() => openChatOps()).not.toThrow();
  });
});
