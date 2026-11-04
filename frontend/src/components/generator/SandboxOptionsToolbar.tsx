import { SandboxTabState } from './hooks/useSandboxTab';

// How the sandbox treats root, what it returns, how much Hyperlambda it takes, and overwriting.
export default function SandboxOptionsToolbar({ sandbox }: Readonly<{ sandbox: SandboxTabState }>) {
  const {
    overrideRoot,
    setOverrideRoot,
    returnCode,
    setReturnCode,
    inputMode,
    maxHyperlambda,
    setMaxHyperlambda,
    overwrite,
    setOverwrite,
  } = sandbox;
  return (
    <div className="toolbar">
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="When on, a root caller runs with the server's full vocabulary and no sandbox"
      >
        Root bypasses the sandbox{' '}
        <input
          type="checkbox"
          checked={overrideRoot}
          onChange={e => setOverrideRoot(e.target.checked)}
        />
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="When on, the response includes the executed code; otherwise it returns only state and result"
      >
        Return code{' '}
        <input
          type="checkbox"
          checked={returnCode}
          onChange={e => setReturnCode(e.target.checked)}
        />
      </label>
      {inputMode !== 'nl' && (
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Maximum characters accepted in [hyperlambda] — longer code is rejected with a 400 before anything is parsed or executed"
        >
          Max Hyperlambda length{' '}
          <input
            type="number"
            value={maxHyperlambda}
            onChange={e => setMaxHyperlambda(e.target.value)}
            style={{ width: 90 }}
          />
        </label>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Overwrite{' '}
        <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />
      </label>
    </div>
  );
}
