import { TOOLTIP_WIDTH } from '../endpointMeta';
import { FileTooltip } from '../hooks/useExecuteFiles';

// The description + arguments of one file ExecuteFilesWizard lists, anchored next to its icon.
export default function FileDescriptionTooltip(
  props: Readonly<{ tooltip: FileTooltip; onClose: () => void }>,
) {
  const { tooltip } = props;
  return (
    <div
      className="card"
      style={{
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y,
        zIndex: 1000,
        width: TOOLTIP_WIDTH,
        maxHeight: 280,
        overflow: 'auto',
        padding: 8,
        fontSize: 12,
        whiteSpace: 'pre-wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div className="toolbar" style={{ marginBottom: 4 }}>
        <span className="mono" style={{ fontWeight: 600 }}>
          {tooltip.path}
        </span>
        <span className="spacer" />
        <button className="btn btn-secondary btn-small" onClick={props.onClose}>
          ×
        </button>
      </div>
      {tooltip.text}
    </div>
  );
}
