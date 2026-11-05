// @vitest-environment jsdom
/*
 * RoleRuleCard and RuleWizards: one role rule's fields write through to the sandbox state, an
 * incomplete rule and an unpinned risk slot are flagged, a rule can be removed, and each
 * capability button opens its wizard (toggling closed on a second press) whose Add merges the
 * granted slots into the rule's editor.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { useSandboxTab } from '../hooks/useSandboxTab';
import RoleRuleCard from '../RoleRuleCard';
import { RoleRule } from '../types';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../CodeEditor', async () => ({
  default: (await import('../../../test/CodeEditorStub')).default,
}));

function rule(patch: Partial<RoleRule> = {}): RoleRule {
  return {
    id: 'r1',
    role: '',
    limit: '',
    window: '',
    timeout: '',
    slots: '',
    description: '',
    ...patch,
  };
}

// Mounts the cards the way SandboxTab does, on the real sandbox state, and mirrors the rules out.
function Harness(props: Readonly<{ seed: RoleRule[] }>) {
  const sandbox = useSandboxTab();
  return (
    <>
      <button onClick={() => sandbox.setRuleList(props.seed)}>seed</button>
      {sandbox.ruleList.map((item, index) => (
        <RoleRuleCard key={item.id} sandbox={sandbox} rule={item} index={index} />
      ))}
      <pre data-testid="rules">{JSON.stringify(sandbox.ruleList)}</pre>
      <pre data-testid="wizard">{JSON.stringify(sandbox.wizard)}</pre>
    </>
  );
}

async function renderCards(seed: RoleRule[]) {
  render(
    <MemoryRouter>
      <Harness seed={seed} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'seed' }));
}

function rules(): RoleRule[] {
  return JSON.parse(screen.getByTestId('rules').textContent ?? '[]') as RoleRule[];
}

function editorValue(index = 0) {
  return (screen.getAllByLabelText('code editor hyperlambda')[index] as HTMLTextAreaElement).value;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'admin' }, { name: 'guest' }] as never);
});

describe('RoleRuleCard', () => {
  it('writes the role, the limits, the description and the slots into the rule', async () => {
    await renderCards([rule()]);

    await userEvent.click(screen.getByText('choose role…'));
    await userEvent.click(await screen.findByRole('option', { name: 'guest' }));
    const numbers = screen.getAllByPlaceholderText('base');
    await userEvent.type(numbers[0], '7');
    await userEvent.type(numbers[1], '30');
    await userEvent.type(numbers[2], '5000');
    await userEvent.type(screen.getByPlaceholderText(/What can this role do/), 'Reads tickets');
    fireEvent.change(screen.getByLabelText('code editor hyperlambda'), {
      target: { value: 'math.add' },
    });

    expect(rules()[0]).toMatchObject({
      role: 'guest',
      limit: '7',
      window: '30',
      timeout: '5000',
      description: 'Reads tickets',
      slots: 'math.add',
    });
  });

  it('flags a rule that has slots but no role until a role is chosen', async () => {
    await renderCards([rule({ slots: 'math.add' })]);

    expect(screen.getByText(/This rule has slots but no role/)).toBeInTheDocument();

    await userEvent.click(screen.getByText('choose role…'));
    await userEvent.click(await screen.findByRole('option', { name: 'admin' }));

    expect(screen.queryByText(/This rule has slots but no role/)).toBeNull();
  });

  it('does not flag an empty rule', async () => {
    await renderCards([rule()]);

    expect(screen.queryByText(/This rule has slots but no role/)).toBeNull();
  });

  it('warns about every unpinned risk slot and accepts a pinned one', async () => {
    await renderCards([rule({ role: 'admin', slots: 'execute\ndata.connect:\ndata.connect:crm' })]);

    const warnings = screen.getAllByText(/has no pinned argument/);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toHaveTextContent('"execute" has no pinned argument');
    expect(warnings[1]).toHaveTextContent('"data.connect" has no pinned argument');
  });

  it('removes the rule and closes the open wizard', async () => {
    await renderCards([rule({ id: 'a', role: 'admin' }), rule({ id: 'b', role: 'guest' })]);
    await userEvent.click(screen.getAllByRole('button', { name: 'Email' })[1]);
    expect(JSON.parse(screen.getByTestId('wizard').textContent)).toEqual({
      index: 1,
      kind: 'email',
    });

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);

    expect(rules().map(r => r.id)).toEqual(['a']);
    expect(screen.getByTestId('wizard')).toHaveTextContent('null');
  });

  it('opens a wizard only on the rule it was asked on', async () => {
    await renderCards([rule({ id: 'a', role: 'admin' }), rule({ id: 'b', role: 'guest' })]);

    await userEvent.click(screen.getAllByRole('button', { name: 'Logging' })[1]);

    expect(screen.getAllByText('Logging', { selector: 'div' })).toHaveLength(1);
    expect(editorValue(0)).toBe('');
  });
});

describe('capability wizards on a rule', () => {
  const FILE = '/modules/shop/orders.get.hl';

  function stubSources() {
    vi.mocked(api.defaultDatabaseType).mockResolvedValue({
      options: ['sqlite'],
      default: 'sqlite',
    });
    vi.mocked(api.http.get).mockResolvedValue({ generic: 'x' });
    vi.mocked(api.listDatabases).mockResolvedValue({
      databases: [{ name: 'crm', tables: [] }],
    });
    vi.mocked(api.listDynamicSlots).mockResolvedValue(['custom.alpha']);
    vi.mocked(api.listFilesRecursively).mockResolvedValue([FILE, '/modules/shop/readme.md']);
    vi.mocked(api.listEndpointsDetailed).mockResolvedValue([]);
  }

  const CASES: {
    button: string;
    title: string;
    prepare?: () => Promise<void>;
    granted: string;
  }[] = [
    {
      button: 'Database',
      title: 'Database access',
      prepare: async () => {
        await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
      },
      granted: 'data.connect:crm\ndata.read\n',
    },
    { button: 'HTTP', title: 'Outbound HTTP', granted: 'http.get\n' },
    { button: 'Files', title: 'File system', granted: 'io.file.load\n' },
    { button: 'Email', title: 'Email', granted: 'mail.smtp.send\nmime.create\n' },
    { button: 'Images', title: 'Images', granted: 'image.resize\n' },
    { button: 'Logging', title: 'Logging', granted: 'log.info\nlog.debug\nlog.error\nlog.fatal\n' },
    {
      button: 'Dynamic slots',
      title: 'Dynamic slots',
      prepare: async () => {
        await userEvent.click(await screen.findByLabelText('custom.alpha'));
      },
      granted: 'execute:custom.alpha\nsignal:custom.alpha\ntry-signal:custom.alpha\n',
    },
    {
      button: 'Execute files',
      title: 'Execute files',
      prepare: async () => {
        await userEvent.click(await screen.findByLabelText(FILE));
      },
      granted:
        'execute-file:' + FILE + '\nio.file.execute:' + FILE + '\nio.file.load:' + FILE + '\n',
    },
    { button: 'Tasks', title: 'Scheduled tasks', granted: 'tasks.list\ntasks.get\ntasks.count\n' },
  ];

  it.each(CASES)('$button merges its slots into the rule', async item => {
    stubSources();
    await renderCards([rule({ role: 'admin' })]);

    await userEvent.click(screen.getByRole('button', { name: item.button }));
    expect(screen.getByText(item.title, { selector: 'div' })).toBeInTheDocument();
    await item.prepare?.();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    for (const line of item.granted.trim().split('\n')) {
      expect(editorValue()).toContain(line);
      expect(rules()[0].slots).toContain(line);
    }
  });

  it.each(CASES)('$button closes from its own Close button', async item => {
    stubSources();
    await renderCards([rule({ role: 'admin' })]);

    await userEvent.click(screen.getByRole('button', { name: item.button }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText(item.title, { selector: 'div' })).toBeNull();
    expect(screen.getByTestId('wizard')).toHaveTextContent('null');
    expect(editorValue()).toBe('');
  });

  it('closes the wizard when its capability button is pressed again', async () => {
    stubSources();
    await renderCards([rule({ role: 'admin' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Email' }));
    expect(screen.getByText('Email', { selector: 'div' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Email' }));

    expect(screen.queryByText('Email', { selector: 'div' })).toBeNull();
  });

  it('swaps to another wizard when a different capability is pressed', async () => {
    stubSources();
    await renderCards([rule({ role: 'admin' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Email' }));
    await userEvent.click(screen.getByRole('button', { name: 'Images' }));

    expect(screen.queryByText('Email', { selector: 'div' })).toBeNull();
    expect(screen.getByText('Images', { selector: 'div' })).toBeInTheDocument();
  });

  it('keeps what is already in the editor and skips lines it already has', async () => {
    stubSources();
    await renderCards([rule({ role: 'admin', slots: 'http.get' })]);

    await userEvent.click(screen.getByRole('button', { name: 'HTTP' }));
    await userEvent.click(screen.getByLabelText('POST'));
    await userEvent.click(
      within(screen.getByText('Outbound HTTP').closest('.card')!).getByRole('button', {
        name: 'Add',
      }),
    );

    expect(editorValue()).toBe('http.get\nhttp.post\n');
  });
});
