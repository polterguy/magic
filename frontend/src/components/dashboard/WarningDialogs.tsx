import { Modal } from '../Dialogs';
import { MCP_ENDPOINT_WARNING } from './constants';

// Opened from the "!" on the Endpoints card.
export function EndpointWarningDialog(
  props: Readonly<{ endpoints: number | null; onClose: () => void }>,
) {
  return (
    <Modal width={560} onClose={props.onClose}>
      <h2>Too many endpoints for MCP</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        This cloudlet has {props.endpoints} HTTP endpoints. Most MCP clients cannot deal effectively
        with much more than {MCP_ENDPOINT_WARNING} — AI agents drown in the tool list, making tool
        discovery and selection slow and unreliable, and some clients refuse to connect at all.
        Consider deleting endpoints you don&apos;t need, or restricting how many your MCP plugin
        exposes.
      </p>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

// Opened from the "!" on the Public endpoints card.
export function PublicEndpointWarningDialog(
  props: Readonly<{ publicEndpoints: number | null; onClose: () => void }>,
) {
  // The card offers this dialog from a single public endpoint, so the text reads for one too.
  if (props.publicEndpoints === 1) {
    return (
      <Modal width={560} onClose={props.onClose}>
        <h2>This cloudlet has a public endpoint</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          This cloudlet has 1 endpoint that requires no authentication whatsoever — anyone who finds
          the URL can invoke it, with no login, token, or role check standing in their way. Make
          sure it can&apos;t read, change, or delete data it shouldn&apos;t, run up costs, or
          otherwise cause damage in the hands of a stranger. If it doesn&apos;t need to be public,
          add an [auth] requirement to it.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={props.onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal width={560} onClose={props.onClose}>
      <h2>This cloudlet has public endpoints</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        This cloudlet has {props.publicEndpoints} endpoints that require no authentication
        whatsoever — anyone who finds the URL can invoke them, with no login, token, or role check
        standing in their way. Make sure none of them can read, change, or delete data they
        shouldn&apos;t, run up costs, or otherwise cause damage in the hands of a stranger. If an
        endpoint doesn&apos;t need to be public, add an [auth] requirement to it.
      </p>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
