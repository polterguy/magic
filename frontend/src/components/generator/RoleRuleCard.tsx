import CodeEditor from '../CodeEditor';
import Select from '../Select';
import RuleWizards from './RuleWizards';
import { lintSlotLines, ruleIsIncomplete } from './slots';
import { TIER2_WIZARDS } from './wizardSpecs';
import { SandboxTabState } from './hooks/useSandboxTab';
import { RoleRule } from './types';

// One role rule: its role, limit overrides, description, capability wizards and slots.
export default function RoleRuleCard(
  props: Readonly<{ sandbox: SandboxTabState; rule: RoleRule; index: number }>,
) {
  const { rule, index } = props;
  const { roles, ruleList, setRuleList, wizard, setWizard, updateRule } = props.sandbox;
  return (
    <div className="card" style={{ padding: 12, marginTop: 8 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Callers in this role also get these slots"
        >
          Role
          <Select value={rule.role} onChange={value => updateRule(index, { role: value })}>
            <option value="">choose role…</option>
            {roles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Invocations per window, per IP — blank inherits the base"
        >
          Limit
          <input
            type="number"
            placeholder="base"
            value={rule.limit}
            onChange={e => updateRule(index, { limit: e.target.value })}
            style={{ width: 70 }}
          />
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Window length in seconds — used only when this role sets a limit"
        >
          Window&nbsp;s
          <input
            type="number"
            placeholder="base"
            value={rule.window}
            onChange={e => updateRule(index, { window: e.target.value })}
            style={{ width: 70 }}
          />
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Timeout in milliseconds — blank inherits the base"
        >
          Timeout&nbsp;ms
          <input
            type="number"
            step={1000}
            placeholder="base"
            value={rule.timeout}
            onChange={e => updateRule(index, { timeout: e.target.value })}
            style={{ width: 80 }}
          />
        </label>
        <span className="spacer" />
        <button
          className="btn btn-danger btn-small"
          onClick={() => {
            setRuleList(ruleList.filter((_, i) => i !== index));
            setWizard(null);
          }}
        >
          Remove
        </button>
      </div>
      {ruleIsIncomplete(rule) && (
        <div className="error-box" style={{ marginBottom: 6, fontSize: 13 }}>
          This rule has slots but no role — choose a role, or remove the rule. It would otherwise be
          dropped.
        </div>
      )}
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <input
          type="text"
          placeholder="What can this role do? (e.g. Can send email and read ticket data)"
          value={rule.description}
          onChange={e => updateRule(index, { description: e.target.value })}
          style={{ flex: 1 }}
        />
      </div>
      {lintSlotLines(rule.slots).map((warning, i) => (
        <div key={i} className="error-box" style={{ marginBottom: 6, fontSize: 13 }}>
          {warning}
        </div>
      ))}
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <span className="muted" style={{ fontSize: 12, marginRight: 4 }}>
          Add capability:
        </span>
        {(
          [
            ['db', 'Database'],
            ['http', 'HTTP'],
            ['files', 'Files'],
            ['email', 'Email'],
            ['images', 'Images'],
            ['logging', 'Logging'],
            ['dynslots', 'Dynamic slots'],
            ['execfiles', 'Execute files'],
            ...Object.entries(TIER2_WIZARDS).map(([kind, spec]) => [kind, spec.label]),
          ] as [string, string][]
        ).map(([kind, label]) => (
          <button
            key={kind}
            className={
              'btn btn-small' +
              (wizard?.index === index && wizard?.kind === kind ? '' : ' btn-secondary')
            }
            onClick={() =>
              setWizard(wizard?.index === index && wizard?.kind === kind ? null : { index, kind })
            }
          >
            {label}
          </button>
        ))}
      </div>
      <RuleWizards sandbox={props.sandbox} rule={rule} index={index} />
      <div style={{ height: 160, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor
          value={rule.slots}
          onChange={value => updateRule(index, { slots: value })}
          mode="hyperlambda"
        />
      </div>
    </div>
  );
}
