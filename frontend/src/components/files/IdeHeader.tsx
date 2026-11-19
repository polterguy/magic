import { copyToClipboard } from '../../lib/toast';
import { BracesIcon, CopyIcon, DownloadIcon, PlayIcon, SaveIcon, SparkIcon } from '../Icons';
import Toolbar, { type ToolbarAction } from '../Toolbar';
import { endpointOf } from './helpers';

/*
 * The Hyper IDE's header — the title, the open file's name and the toolbar
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
  const hyperlambda = selectedFile.endsWith('.hl');

  /*
   * Listed left to right. When the row runs out of room the leftmost go into the "more" menu
   * first, so the occasional actions leave before the frequent ones, and Save never does.
   */
  const actions: ToolbarAction[] = [];
  if (selectedFile) {
    actions.push(
      {
        id: 'copy',
        label: 'Copy path',
        icon: <CopyIcon />,
        onClick: () => void copyToClipboard(selectedFile, 'The path'),
      },
      {
        id: 'download',
        label: 'Download',
        title: 'Download file',
        icon: <DownloadIcon />,
        onClick: () => void props.onDownload(),
      },
    );
  }
  if (endpointOf(selectedFile)) {
    actions.push({
      id: 'openapi',
      label: 'OpenAPI',
      title: 'OpenAPI specification for this endpoint',
      icon: <BracesIcon />,
      onClick: () => void props.onOpenApi(selectedFile),
    });
  }
  if (hyperlambda) {
    actions.push(
      {
        id: 'generate',
        label: 'Generate',
        busyLabel: 'Generating…',
        title: 'Run the selected text through the Hyperlambda generator',
        icon: <SparkIcon />,
        busy: generating,
        disabled: !hasSelection,
        onClick: () => void props.onGenerate(),
      },
      {
        id: 'execute',
        label: 'Execute',
        title: 'Execute this Hyperlambda',
        icon: <PlayIcon />,
        onClick: () => void props.onExecute(),
      },
    );
  }
  actions.push({
    id: 'save',
    label: 'Save',
    busyLabel: 'Saving…',
    icon: <SaveIcon />,
    primary: true,
    pinned: true,
    busy: saving,
    disabled: !selectedFile || !dirty,
    onClick: () => void props.onSave(),
  });

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
      {/*
       * The full path, since the tab already names the file. When it doesn't fit it loses its
       * start rather than its end, so the folders nearest the file stay readable. The unsaved
       * marker always occupies its slot, only shown or hidden, so editing the file changes the
       * width of nothing.
       */}
      <span className="mono ide-path" title={selectedFile || undefined}>
        <span className="ide-path-text">
          <bdi dir="ltr">{selectedFile || 'No file open'}</bdi>
        </span>
        <span
          className={dirty ? 'ide-dirty is-dirty' : 'ide-dirty'}
          title={dirty ? 'Unsaved changes' : undefined}
          aria-hidden={!dirty}
        >
          •
        </span>
      </span>
      <Toolbar actions={actions} moreTitle="More file actions" />
    </div>
  );
}
