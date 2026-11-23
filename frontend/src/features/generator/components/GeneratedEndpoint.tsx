import { featureHref } from '@core/features';
import CodeEditor from '@shared/ui/CodeEditor';
import { useNavigate } from 'react-router-dom';

/*
 * The read-only preview of an endpoint that was just generated, with shortcuts to open it where it can be run or edited.
 */
export default function GeneratedEndpoint(
  props: Readonly<{
    preview: string;
    generated: { path: string; file: string; verb: string } | null;
    endpointsTitle?: string;
  }>,
) {
  const navigate = useNavigate();
  const { generated } = props;
  // Where the generated endpoint can be seen next, when those features are part of this build.
  const endpointsHref =
    generated &&
    featureHref(
      'endpoints',
      '?filter=' +
        encodeURIComponent(generated.path) +
        '&expand=' +
        encodeURIComponent(generated.verb),
    );
  const filesHref =
    generated && featureHref('files', '?open=' + encodeURIComponent(generated.file));
  return (
    <>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Generated endpoint</div>
        <span className="muted" style={{ fontSize: 12 }}>
          read-only preview of what was saved
        </span>
        <span className="spacer" />
        {endpointsHref && (
          <button
            className="btn btn-secondary btn-small"
            title={props.endpointsTitle}
            onClick={() => void navigate(endpointsHref)}
          >
            Open in Endpoints
          </button>
        )}
        {filesHref && (
          <button className="btn btn-secondary btn-small" onClick={() => void navigate(filesHref)}>
            Open in Hyper IDE
          </button>
        )}
      </div>
      <div style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={props.preview} mode="hyperlambda" readOnly={true} />
      </div>
    </>
  );
}
