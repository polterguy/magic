import { useNavigate } from 'react-router-dom';
import CodeEditor from '../CodeEditor';

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
  return (
    <>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Generated endpoint</div>
        <span className="muted" style={{ fontSize: 12 }}>
          read-only preview of what was saved
        </span>
        <span className="spacer" />
        {generated && (
          <>
            <button
              className="btn btn-secondary btn-small"
              title={props.endpointsTitle}
              onClick={() =>
                navigate(
                  '/endpoints?filter=' +
                    encodeURIComponent(generated.path) +
                    '&expand=' +
                    encodeURIComponent(generated.verb),
                )
              }
            >
              Open in Endpoints
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => navigate('/hyper-ide?open=' + encodeURIComponent(generated.file))}
            >
              Open in Hyper IDE
            </button>
          </>
        )}
      </div>
      <div style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={props.preview} mode="hyperlambda" readOnly={true} />
      </div>
    </>
  );
}
