import { copyToClipboard } from '../../lib/toast';
import BusyLabel from '../BusyLabel';
import { BracesIcon, CopyIcon, DownloadIcon, PlayIcon, SaveIcon, SparkIcon } from '../Icons';
import { endpointOf } from './helpers';

/*
 * The Hyper IDE's header — the title, the open file's path and the toolbar
 * acting on that file.
 */
export default function IdeHeader(
  props: Readonly<{
    selectedFile: string;
    dirty: boolean;
    saving: boolean;
    generating: boolean;
    hasSelection: boolean;
    onDownload: () => Promise<void>;
    onOpenApi: (target: string) => Promise<void>;
    onGenerate: () => Promise<void>;
    onExecute: () => Promise<void>;
    onSave: () => Promise<boolean>;
  }>,
) {
  const { selectedFile, dirty, saving, generating, hasSelection } = props;
  return (
    <div
      className="page-header ide-header"
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <div className="page-title ide-title">
        <h1>Hyper IDE</h1>
        {/*
         * The subtitle is guidance for an empty IDE, and once a file is open
         * it only competes with the toolbar for horizontal space — which is
         * what used to wrap the header onto extra lines.
         */}
        {!selectedFile && <p>Browse and edit any file on your server</p>}
      </div>
      <span className="spacer" style={{ flex: 1 }} />
      <span className="mono ide-path">
        {selectedFile || 'No file open'}
        {dirty ? ' •' : ''}
      </span>
      {selectedFile && (
        <>
          <button
            className="btn btn-secondary btn-small"
            title="Copy path"
            onClick={() => {
              void copyToClipboard(selectedFile, 'The path');
            }}
          >
            <CopyIcon />
            Copy path
          </button>
          <button
            className="btn btn-secondary btn-small"
            title="Download file"
            onClick={props.onDownload}
          >
            <DownloadIcon />
            Download
          </button>
        </>
      )}
      {endpointOf(selectedFile) && (
        <button
          className="btn btn-secondary btn-small"
          title="OpenAPI specification for this endpoint"
          onClick={() => props.onOpenApi(selectedFile)}
        >
          <BracesIcon />
          OpenAPI
        </button>
      )}
      {selectedFile.endsWith('.hl') && (
        <button
          className="btn btn-secondary btn-small"
          title="Run the selected text through the Hyperlambda generator"
          onClick={props.onGenerate}
          disabled={generating || !hasSelection}
        >
          <SparkIcon />
          <BusyLabel busy={generating} label="Generate" busyLabel="Generating…" />
        </button>
      )}
      {selectedFile.endsWith('.hl') && (
        <button className="btn btn-secondary btn-small" onClick={props.onExecute}>
          <PlayIcon />
          Execute
        </button>
      )}
      <button
        className="btn btn-small"
        onClick={props.onSave}
        disabled={!selectedFile || !dirty || saving}
      >
        <SaveIcon />
        <BusyLabel busy={saving} label="Save" busyLabel="Saving…" />
      </button>
    </div>
  );
}
