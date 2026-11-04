import { SandboxTabState } from './hooks/useSandboxTab';

// Adds a role rule, seeded with the base's limits, and explains how rules combine.
export default function AddRoleRule({ sandbox }: Readonly<{ sandbox: SandboxTabState }>) {
  const { ruleList, setRuleList, baseLimit, baseWindow, baseTimeout } = sandbox;
  return (
    <div className="toolbar" style={{ marginTop: 8 }}>
      <button
        className="btn btn-secondary btn-small"
        onClick={() =>
          setRuleList([
            ...ruleList,
            {
              role: '',
              limit: baseLimit,
              window: baseWindow,
              timeout: baseTimeout,
              slots: '',
              description: '',
            },
          ])
        }
      >
        + Add role rule
      </button>
      <span className="muted" style={{ fontSize: 12, flexBasis: '100%' }}>
        Slots are added on top of the base for callers in the role. Limit and timeout are optional —
        blank inherits from a later rule or the base; rules are matched top to bottom, so order the
        most-privileged first. One slot per line — <span className="mono">slot</span>, or{' '}
        <span className="mono">slot:value</span> to pin an argument (e.g.{' '}
        <span className="mono">data.connect:xyz</span>).
      </span>
    </div>
  );
}
