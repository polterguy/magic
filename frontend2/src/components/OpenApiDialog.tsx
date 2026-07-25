/*
 * Shared OpenAPI specification dialog — shows the spec for a single endpoint
 * file or a whole folder/module, with the JSON itself and a copyable live
 * spec URL for external tools like Swagger UI or Postman.
 */

import { copyToClipboard } from '../lib/toast';
import CodeEditor from './CodeEditor';
import { Modal } from './Dialogs';
import { backendInfo } from '../lib/api';

export default function OpenApiDialog(props: {
  json: string;
  target: string;
  onClose: () => void;
  onNotify?: (text: string) => void;
}) {

  const specUrl = backendInfo().url +
    '/magic/system/endpoints/openapi?system=true&filter=' + encodeURIComponent(props.target);

  return (
    <Modal width={800} onClose={props.onClose}>
      <h2>OpenAPI specification — {props.target}</h2>
      <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={props.json} mode="application/json" readOnly />
      </div>
      <div className="modal-actions">
        <button
          className="btn btn-secondary"
          title="Copies a URL always returning the current spec — note it requires authentication"
          onClick={() => {
            copyToClipboard(specUrl, 'The spec URL');
          }}>
          Copy spec URL
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            copyToClipboard(props.json, 'The specification');
          }}>
          Copy JSON
        </button>
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
