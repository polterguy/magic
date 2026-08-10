import { nameOf } from './paths';

/*
 * The strip of tabs above the editor — one tab per open file, in the order
 * they were opened, with a dirty marker while content differs from what was
 * last saved.
 */
export default function FileTabs(props: {
  openFiles: { path: string; content: string; saved: string }[];
  selectedFile: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}) {
  return (
    <div className="file-tabs">
      {props.openFiles.map(file => (
        <div
          key={file.path}
          className={'file-tab' + (file.path === props.selectedFile ? ' active' : '')}
          title={file.path}
          onClick={() => props.onSelect(file.path)}>
          <span className="file-tab-name">
            {nameOf(file.path)}
            {file.content !== file.saved && <span className="file-tab-dirty" />}
          </span>
          <button
            className="file-tab-close"
            title="Close"
            onClick={event => { event.stopPropagation(); props.onClose(file.path); }}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
