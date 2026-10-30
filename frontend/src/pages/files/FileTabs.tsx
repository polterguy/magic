import { nameOf } from './paths';

/*
 * The strip of tabs above the editor — one tab per open file, in the order
 * they were opened, with a dirty marker while content differs from what was
 * last saved.
 */
export default function FileTabs(props: Readonly<{
  openFiles: { path: string; content: string; saved: string }[];
  selectedFile: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}>) {
  return (
    <div className="file-tabs" role="tablist">
      {props.openFiles.map(file => (
        <div
          key={file.path}
          className={'file-tab' + (file.path === props.selectedFile ? ' active' : '')}
          title={file.path}
          role="tab"
          aria-selected={file.path === props.selectedFile}
          tabIndex={0}
          onKeyDown={event => {
            // Not when the key was meant for the close button inside the tab.
            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              props.onSelect(file.path);
            }
          }}
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
