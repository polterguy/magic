import { canonicalUrl } from './designerFiles';
import { liveSandbox } from './html';

// The live view: the saved page run for real, and the warning when that is riskier than usual.
export default function LivePane(
  props: Readonly<{
    path: string;
    origin: string;
    width: number | null;
    sameOrigin: boolean;
    liveWarned: boolean;
    warnedKey: string;
    setLiveWarned: (warned: boolean) => void;
  }>,
) {
  const { path, origin, width, sameOrigin, liveWarned, warnedKey, setLiveWarned } = props;
  return (
    <div className="designer-canvas">
      {sameOrigin && !liveWarned && (
        <div className="designer-live-warning">
          <p>
            <strong>This page runs for real here.</strong> Its JavaScript executes, unlike in Design
            — so open a page you did not write only if you trust it.
          </p>
          <p>
            This cloudlet also serves the dashboard, so Live runs the page with no origin of its own
            to keep it away from your session. Storage and calls the page makes to its own API will
            not behave as they do in production; open it in a new tab from the menu to see it work
            properly.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              localStorage.setItem(warnedKey, 'seen');
              setLiveWarned(true);
            }}
          >
            Got it
          </button>
        </div>
      )}
      <iframe
        className="designer-frame"
        title="Live preview"
        sandbox={liveSandbox(sameOrigin)}
        src={origin + canonicalUrl(path)}
        style={width ? { width } : undefined}
      />
    </div>
  );
}
