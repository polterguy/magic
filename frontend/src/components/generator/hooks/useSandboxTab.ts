import { useEffect, useState } from 'react';

import { generateSandboxEndpoint, listRoles } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import { DEFAULT_BASE_SLOTS } from '../baseSlots';
import { linesToSlots, ruleIsIncomplete } from '../slots';
import { GeneratedInfo, PolicyRule, RoleRule, SandboxPolicy } from '../types';

// SandboxTab's state: the endpoint, its base vocabulary and role rules, and generating it.
export function useSandboxTab() {
  const [moduleName, setModuleName] = useState('');
  const [endpointName, setEndpointName] = useState('run');
  const [verb, setVerb] = useState('post');
  const [inputMode, setInputMode] = useState('both');
  const [overrideRoot, setOverrideRoot] = useState(true);
  const [returnCode, setReturnCode] = useState(false);
  // Maximum characters accepted in [hyperlambda]; blank or non-numeric keeps the backend default.
  const [maxHyperlambda, setMaxHyperlambda] = useState('4000');
  const [overwrite, setOverwrite] = useState(false);
  // Who may call the endpoint at all — empty means public.
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  // The "everybody" base rule: the language, rate limit and timeout every caller gets.
  const [baseSlots, setBaseSlots] = useState(DEFAULT_BASE_SLOTS);
  const [baseLimit, setBaseLimit] = useState('10');
  const [baseWindow, setBaseWindow] = useState('60');
  const [baseTimeout, setBaseTimeout] = useState('20000');
  // Per-role rules, each adding slots and optionally overriding limit/window/timeout.
  const [ruleList, setRuleList] = useState<RoleRule[]>([]);
  // Which role rule (by index) has which capability wizard open, if any.
  const [wizard, setWizard] = useState<{ index: number; kind: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  // The endpoint that was just generated, so it can be opened straight from here.
  const [generated, setGenerated] = useState<GeneratedInfo | null>(null);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  function updateRule(index: number, patch: Partial<RoleRule>) {
    setRuleList(ruleList.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }

  // Rules carrying slots/overrides but no role would be dropped silently — block on them.
  const hasIncompleteRule = ruleList.some(ruleIsIncomplete);

  async function generate() {
    if (!moduleName || !endpointName) {
      showToast('Provide a module name and an endpoint name', true);
      return;
    }
    /*
     * Role rules first, most-access-first, so the first matching role wins each
     * dimension; the base "everybody" rule last as the '*' fallback. A role only
     * carries [limit]/[window] or [timeout] when it actually overrides them, so a
     * blank field simply inherits from a later rule or the base.
     */
    const rules = [
      ...ruleList
        .filter(rule => rule.role.trim())
        .map(rule => {
          const out: PolicyRule = { role: rule.role.trim(), slots: linesToSlots(rule.slots) };
          if (rule.limit.trim()) {
            out.limit = Number(rule.limit);
            out.window = Number(rule.window) || Number(baseWindow) || 60;
          }
          if (rule.timeout.trim()) {
            out.timeout = Number(rule.timeout);
          }
          if (rule.description.trim()) {
            out.description = rule.description.trim();
          }
          return out;
        }),
      {
        role: '*',
        limit: Number(baseLimit) || 0,
        window: Number(baseWindow) || 60,
        timeout: Number(baseTimeout) || 20000,
        slots: linesToSlots(baseSlots),
      },
    ];
    const policy: SandboxPolicy = { overrideRoot, returnCode, rules };
    // The hyperlambda length cap only applies when the endpoint accepts it; blank keeps the template default.
    const maxHl = Number(maxHyperlambda);
    if (inputMode !== 'nl' && Number.isFinite(maxHl) && maxHl > 0) {
      policy.maxHyperlambda = maxHl;
    }
    setBusy(true);
    try {
      const response = await generateSandboxEndpoint({
        moduleName,
        endpointName,
        verb,
        inputMode,
        authorization: auth.join(','),
        policy: JSON.stringify(policy),
        overwrite,
      });
      const path = 'magic/modules/' + moduleName + '/' + endpointName;
      setPreview(response.hyperlambda);
      setGenerated({ path, file: response.file, verb });
      showToast('Endpoint ' + path + ' created');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return {
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    verb,
    setVerb,
    inputMode,
    setInputMode,
    overrideRoot,
    setOverrideRoot,
    returnCode,
    setReturnCode,
    maxHyperlambda,
    setMaxHyperlambda,
    overwrite,
    setOverwrite,
    roles,
    auth,
    setAuth,
    authOpen,
    setAuthOpen,
    baseSlots,
    setBaseSlots,
    baseLimit,
    setBaseLimit,
    baseWindow,
    setBaseWindow,
    baseTimeout,
    setBaseTimeout,
    ruleList,
    setRuleList,
    wizard,
    setWizard,
    busy,
    preview,
    generated,
    updateRule,
    hasIncompleteRule,
    generate,
  };
}

// Everything the tab's sections read and change.
export type SandboxTabState = ReturnType<typeof useSandboxTab>;
