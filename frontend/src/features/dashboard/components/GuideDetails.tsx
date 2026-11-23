import { openSupport } from '@shared/lib/support';
import { features, hasFeature } from '@shared/shell/features';
import { openChatOps, openPalette } from '@shared/shell/shellActions';
import { RobotIcon, SearchIcon } from '@shared/ui/Icons';
import { Link } from 'react-router-dom';

/*
 * Folded away rather than always open. It restates the navigation for
 * somebody seeing the dashboard for the first time, which is worth a
 * click to reach and not worth scrolling past every day after that.
 */
export default function GuideDetails(props: Readonly<{ openaiConfigured: boolean | null }>) {
  return (
    <details className="card guide-details">
      <summary>
        <span className="guide-summary-title">What everything does</span>
        <span className="muted">Every part of your cloudlet, and where to find it.</span>
      </summary>
      <div className="guide-grid">
        {features().flatMap(({ id, path, nav }) =>
          nav?.description && path !== undefined
            ? [
                <Link className="guide-card" key={id} to={path}>
                  <span className="guide-icon">
                    <nav.Icon />
                  </span>
                  <span>
                    <span className="guide-title">{nav.label}</span>
                    <span className="guide-text">{nav.description}</span>
                  </span>
                </Link>,
              ]
            : [],
        )}
        {/*
         * The last cards are the ones that aren't routes — overlays that
         * open over whatever you are looking at, wearing the same clothes
         * as their neighbours.
         */}
        {props.openaiConfigured === true && hasFeature('chat') && (
          <button className="guide-card" type="button" onClick={openChatOps}>
            <span className="guide-icon">
              <RobotIcon />
            </span>
            <span>
              <span className="guide-title">Chat Ops</span>
              <span className="guide-text">
                Talk to your cloudlet from any screen — generate endpoints, query your databases, or
                ask what your backend can do. It runs AI functions on your behalf and stays open as
                you navigate. Ctrl+. / Cmd+.
              </span>
            </span>
          </button>
        )}
        <button className="guide-card" type="button" onClick={openPalette}>
          <span className="guide-icon">
            <SearchIcon />
          </span>
          <span>
            <span className="guide-title">Command palette</span>
            <span className="guide-text">
              One box that finds anything — pages, files, endpoints, tasks and models — plus quick
              actions like switching cloudlet or theme. Ctrl+K / Cmd+K
            </span>
          </span>
        </button>
        <button className="guide-card" type="button" onClick={openSupport}>
          <span className="guide-icon">
            <RobotIcon />
          </span>
          <span>
            <span className="guide-title">Ask Frank</span>
            <span className="guide-text">
              Magic&apos;s AI support agent, trained on the Hyperlambda and Magic documentation. Ask
              it how something works and it answers with code you can paste.
            </span>
          </span>
        </button>
      </div>
    </details>
  );
}
