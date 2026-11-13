import BusyLabel from '../BusyLabel';
import { RedoIcon, SaveIcon, UndoIcon } from '../Icons';
import { canonicalUrl } from './designerFiles';
import DesignerMenu from './DesignerMenu';
import { VIEWS } from './layout';
import type { DesignerMenuOptions } from './menuItems';

// The header of the page: the page picker, the views, undo and redo, the menu and Save.
export default function DesignerToolbar(
  props: Readonly<{
    path: string;
    pages: string[];
    stale: boolean;
    view: string;
    onOpenPage: (file: string) => void;
    onSwitchView: (view: string) => void;
    onUndo: () => void;
    canUndo: boolean;
    onRedo: () => void;
    canRedo: boolean;
    menu: DesignerMenuOptions;
    onSave: () => void;
    dirty: boolean;
    saving: boolean;
  }>,
) {
  const { path, pages, view } = props;
  return (
    <div
      className="page-header ide-header"
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <div className="page-title ide-title">
        <h1>Web Designer</h1>
        {!path && <p>Design the pages your cloudlet serves</p>}
      </div>
      <span className="spacer" style={{ flex: 1 }} />
      {props.stale && (
        <span
          className="badge badge-put"
          title="Chat Ops wrote files while you had unsaved changes"
        >
          Changed on server
        </span>
      )}
      <select
        className="designer-page-select"
        value={path}
        title="The page being designed"
        disabled={pages.length === 0}
        onChange={event => props.onOpenPage(event.target.value)}
      >
        {pages.length === 0 && <option value="">No pages in /etc/www/</option>}
        {pages.map(file => (
          <option key={file} value={file}>
            {canonicalUrl(file)}
          </option>
        ))}
      </select>
      <div className="tabs designer-viewports">
        {VIEWS.map(entry => (
          <button
            key={entry.id}
            type="button"
            className={'tab' + (entry.id === view ? ' active' : '')}
            title={entry.hint}
            disabled={!path}
            onClick={() => props.onSwitchView(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <button
        className="btn btn-secondary btn-small"
        title="Undo the last change"
        onClick={props.onUndo}
        disabled={!props.canUndo}
      >
        <UndoIcon />
        Undo
      </button>
      <button
        className="btn btn-secondary btn-small"
        title="Redo the change that was undone"
        onClick={props.onRedo}
        disabled={!props.canRedo}
      >
        <RedoIcon />
        Redo
      </button>
      <DesignerMenu {...props.menu} />
      <button
        className="btn btn-small"
        onClick={props.onSave}
        disabled={!path || !props.dirty || props.saving}
      >
        <SaveIcon />
        <BusyLabel busy={props.saving} label="Save" busyLabel="Saving…" />
      </button>
    </div>
  );
}
