/*
 * Shared OpenAPI specification dialog — shows the spec for a single endpoint
 * file or a whole folder/module, with the JSON itself and a copyable live
 * spec URL for external tools like Swagger UI or Postman.
 */

import { backendInfo } from '../api';
import { copyToClipboard } from '../lib/toast';
import CodeEditor from './CodeEditor';
import { Modal } from './Dialogs';

export default function OpenApiDialog(
  props: Readonly<{
    json: string;
    target: string;
    onClose: () => void;
  }>,
) {
  const specUrl =
    backendInfo().url +
    '/magic/system/endpoints/openapi?system=true&filter=' +
    encodeURIComponent(props.target);

  return (
    <Modal
      size="lg"
      onClose={props.onClose}
      title={'OpenAPI specification — ' + props.target}
      actions={
        <>
          <button
            className="btn btn-secondary"
            title="Copies a URL always returning the current spec — note it requires authentication"
            onClick={() => {
              void copyToClipboard(specUrl, 'The spec URL');
            }}
          >
            Copy spec URL
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              void copyToClipboard(props.json, 'The specification');
            }}
          >
            Copy JSON
          </button>
          <button className="btn" onClick={props.onClose}>
            Close
          </button>
        </>
      }
    >
      <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={props.json} mode="application/json" readOnly />
      </div>
    </Modal>
  );
}
