import AiWaiter from '../AiWaiter';
import AddRoleRule from './AddRoleRule';
import CallerRolesField from './CallerRolesField';
import GeneratedEndpoint from './GeneratedEndpoint';
import { useSandboxTab } from './hooks/useSandboxTab';
import RoleRuleCard from './RoleRuleCard';
import SandboxBaseRule from './SandboxBaseRule';
import SandboxEndpointToolbar from './SandboxEndpointToolbar';
import SandboxOptionsToolbar from './SandboxOptionsToolbar';

/*
 * The Sandbox API generator: one endpoint that takes caller-supplied Hyperlambda
 * and/or a natural-language instruction, verifies every referenced function exists,
 * and runs it inside a whitelist whose vocabulary and rate limit come from the
 * caller's roles.
 *
 * The vocabulary is layered: an "everybody" base rule grants the language every
 * caller gets, and each role rule adds slots on top of it — so a CEO role can reach
 * a database an HR role cannot, while both keep the base. Rate limits are matched
 * most-specific-first, with the base as the fallback; root is never throttled or
 * timed out.
 */
export default function SandboxTab() {
  const sandbox = useSandboxTab();
  const { roles, auth, setAuth, authOpen, setAuthOpen, ruleList, busy, preview, generated } =
    sandbox;

  return (
    <>
      <SandboxEndpointToolbar sandbox={sandbox} />
      <SandboxOptionsToolbar sandbox={sandbox} />
      {/* Who may call the endpoint at all — empty leaves it public. */}
      <CallerRolesField
        roles={roles}
        auth={auth}
        setAuth={setAuth}
        authOpen={authOpen}
        setAuthOpen={setAuthOpen}
      />
      {/* The "everybody" base rule — the vocabulary and fallback limit every caller gets. */}
      <SandboxBaseRule sandbox={sandbox} />
      {/* Per-role rules — each adds slots on top of the base for its role. */}
      {ruleList.map((rule, index) => (
        <RoleRuleCard key={index} sandbox={sandbox} rule={rule} index={index} />
      ))}
      <AddRoleRule sandbox={sandbox} />
      {preview && (
        <GeneratedEndpoint
          preview={preview}
          generated={generated}
          endpointsTitle="Invoke it, or describe what each role can call"
        />
      )}
      {busy && <AiWaiter />}
    </>
  );
}
