// @vitest-environment jsdom
/*
 * useSandboxTab: loads the roles, blocks incomplete role rules, and turns the form into the
 * policy the sandbox endpoint generator receives.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { useSandboxTab } from '../hooks/useSandboxTab';
import { RoleRule } from '../types';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

function rule(patch: Partial<RoleRule> = {}): RoleRule {
  return {
    id: 'r1',
    role: 'admin',
    limit: '',
    window: '',
    timeout: '',
    slots: '',
    description: '',
    ...patch,
  };
}

function lastPolicy() {
  const call = vi.mocked(api.generateSandboxEndpoint).mock.calls[0][0];
  return { call, policy: JSON.parse(call.policy) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }, { name: 'admin' }] as never);
  vi.mocked(api.generateSandboxEndpoint).mockResolvedValue({
    hyperlambda: 'code',
    file: '/modules/m/run.post.hl',
  } as never);
});

describe('useSandboxTab', () => {
  it('loads the role names', async () => {
    const { result } = renderHook(() => useSandboxTab());

    await waitFor(() => expect(result.current.roles).toEqual(['root', 'admin']));
  });

  it('keeps an empty role list when the roles cannot be loaded', async () => {
    vi.mocked(api.listRoles).mockRejectedValue(new Error('no'));
    const { result } = renderHook(() => useSandboxTab());

    await waitFor(() => expect(api.listRoles).toHaveBeenCalled());
    expect(result.current.roles).toEqual([]);
  });

  it('refuses to generate without a module name', async () => {
    const { result } = renderHook(() => useSandboxTab());

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith('Provide a module name and an endpoint name', true);
    expect(api.generateSandboxEndpoint).not.toHaveBeenCalled();
  });

  it('updates one rule and flags rules that have slots but no role', () => {
    const { result } = renderHook(() => useSandboxTab());

    act(() => result.current.setRuleList([rule({ id: 'a' }), rule({ id: 'b', role: '' })]));
    expect(result.current.hasIncompleteRule).toBe(false);

    act(() => result.current.updateRule(1, { slots: 'math.add' }));

    expect(result.current.ruleList[1].slots).toBe('math.add');
    expect(result.current.ruleList[0].slots).toBe('');
    expect(result.current.hasIncompleteRule).toBe(true);
  });

  it('sends role rules first and the base rule last as the star fallback', async () => {
    const { result } = renderHook(() => useSandboxTab());
    act(() => {
      result.current.setModuleName('mod');
      result.current.setAuth(['root', 'admin']);
      result.current.setBaseLimit('7');
      result.current.setBaseWindow('30');
      result.current.setBaseTimeout('5000');
      result.current.setRuleList([
        rule({
          role: ' admin ',
          limit: '100',
          window: '',
          timeout: '9000',
          slots: 'math.add',
          description: ' can add ',
        }),
        rule({ id: 'r2', role: '   ' }),
        rule({ id: 'r3', role: 'dev' }),
      ]);
    });

    await act(() => result.current.generate());

    const { call, policy } = lastPolicy();
    expect(call).toMatchObject({
      moduleName: 'mod',
      endpointName: 'run',
      verb: 'post',
      inputMode: 'both',
      authorization: 'root,admin',
      overwrite: false,
    });
    expect(policy.overrideRoot).toBe(true);
    expect(policy.returnCode).toBe(false);
    expect(policy.maxHyperlambda).toBe(4000);
    expect(policy.rules).toHaveLength(3);
    // The window falls back to the base window when the rule leaves it blank.
    expect(policy.rules[0]).toEqual({
      role: 'admin',
      slots: ['math.add'],
      limit: 100,
      window: 30,
      timeout: 9000,
      description: 'can add',
    });
    expect(policy.rules[1]).toEqual({ role: 'dev', slots: [] });
    expect(policy.rules[2]).toMatchObject({ role: '*', limit: 7, window: 30, timeout: 5000 });
  });

  it('omits the length cap for natural-language-only endpoints and for blank values', async () => {
    const { result } = renderHook(() => useSandboxTab());
    act(() => {
      result.current.setModuleName('mod');
      result.current.setInputMode('nl');
    });
    await act(() => result.current.generate());
    expect(lastPolicy().policy.maxHyperlambda).toBeUndefined();

    vi.mocked(api.generateSandboxEndpoint).mockClear();
    act(() => {
      result.current.setInputMode('both');
      result.current.setMaxHyperlambda('');
    });
    await act(() => result.current.generate());
    expect(lastPolicy().policy.maxHyperlambda).toBeUndefined();
  });

  it('shows the generated endpoint and says where it was created', async () => {
    const { result } = renderHook(() => useSandboxTab());
    act(() => {
      result.current.setModuleName('mod');
      result.current.setVerb('get');
    });

    await act(() => result.current.generate());

    expect(result.current.preview).toBe('code');
    expect(result.current.generated).toEqual({
      path: 'magic/modules/mod/run',
      file: '/modules/m/run.post.hl',
      verb: 'get',
    });
    expect(result.current.busy).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Endpoint magic/modules/mod/run created');
  });

  it('reports a failed generation as an error toast', async () => {
    vi.mocked(api.generateSandboxEndpoint).mockRejectedValue(new Error('exists'));
    const { result } = renderHook(() => useSandboxTab());
    act(() => result.current.setModuleName('mod'));

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith('exists', true, undefined);
    expect(result.current.generated).toBeNull();
    expect(result.current.busy).toBe(false);
  });
});
