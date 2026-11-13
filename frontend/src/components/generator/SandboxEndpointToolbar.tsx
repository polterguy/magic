import BusyLabel from '../BusyLabel';
import Select from '../Select';
import EndpointNameFields from './EndpointNameFields';
import { SandboxTabState } from './hooks/useSandboxTab';

// The sandbox endpoint's verb, name and input, and the Generate button.
export default function SandboxEndpointToolbar({
  sandbox,
}: Readonly<{ sandbox: SandboxTabState }>) {
  const {
    verb,
    setVerb,
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    inputMode,
    setInputMode,
    generate,
    busy,
    hasIncompleteRule,
    hasRefusedSlot,
  } = sandbox;
  let blocked: string | undefined;
  if (hasIncompleteRule) {
    blocked = 'A role rule has slots but no role — choose a role or remove it';
  } else if (hasRefusedSlot) {
    blocked = 'A slot that changes the file system cannot be granted to a sandbox — remove it';
  }
  return (
    <div className="toolbar">
      <EndpointNameFields
        verbs={['post', 'get', 'put', 'delete', 'patch']}
        verb={verb}
        onVerb={setVerb}
        moduleName={moduleName}
        onModuleName={setModuleName}
        endpointName={endpointName}
        onEndpointName={setEndpointName}
      />
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="What the endpoint accepts — this shapes its arguments and description"
      >
        Input
        <Select value={inputMode} onChange={value => setInputMode(value)}>
          <option value="both">Hyperlambda + Natural language</option>
          <option value="hl">Hyperlambda</option>
          <option value="nl">Natural language</option>
        </Select>
      </label>
      <span className="spacer" />
      <button className="btn" onClick={generate} disabled={busy || !!blocked} title={blocked}>
        <BusyLabel busy={busy} label="⚙ Generate endpoint" busyLabel="Generating…" />
      </button>
    </div>
  );
}
