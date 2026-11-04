import CodeEditor from '../CodeEditor';
import { lintSlotLines } from './slots';
import { SandboxTabState } from './hooks/useSandboxTab';

// The "everybody" base rule — the vocabulary and fallback limit every caller gets.
export default function SandboxBaseRule({ sandbox }: Readonly<{ sandbox: SandboxTabState }>) {
  const {
    baseLimit,
    setBaseLimit,
    baseWindow,
    setBaseWindow,
    baseTimeout,
    setBaseTimeout,
    baseSlots,
    setBaseSlots,
  } = sandbox;
  return (
    <div className="card" style={{ padding: 12, marginTop: 8 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Everybody (base vocabulary)</div>
        <span className="spacer" />
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Fallback invocations per window, per IP, for callers with no matching role rule"
        >
          Limit
          <input
            type="number"
            value={baseLimit}
            onChange={e => setBaseLimit(e.target.value)}
            style={{ width: 80 }}
          />
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Window length in seconds"
        >
          Window&nbsp;s
          <input
            type="number"
            value={baseWindow}
            onChange={e => setBaseWindow(e.target.value)}
            style={{ width: 80 }}
          />
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Fallback timeout in milliseconds — root is exempt"
        >
          Timeout&nbsp;ms
          <input
            type="number"
            step={1000}
            value={baseTimeout}
            onChange={e => setBaseTimeout(e.target.value)}
            style={{ width: 90 }}
          />
        </label>
      </div>
      {lintSlotLines(baseSlots).map((warning, i) => (
        <div key={i} className="error-box" style={{ marginBottom: 6, fontSize: 13 }}>
          {warning}
        </div>
      ))}
      <div style={{ height: 240, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={baseSlots} onChange={setBaseSlots} mode="hyperlambda" />
      </div>
    </div>
  );
}
