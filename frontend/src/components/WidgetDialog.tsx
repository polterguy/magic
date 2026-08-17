/*
 * Renders an HTML widget the model asked the frontend to display.
 *
 * Widgets carry their own CSS and JavaScript, and JavaScript is the reason this
 * is an iframe rather than a div: a <script> assigned through innerHTML is
 * parsed but never executed, so a widget injected inline renders and styles
 * correctly while every behaviour in it silently does nothing.
 *
 * The same approach the Expert System frontend uses — srcDoc, scripts allowed,
 * and the document measuring itself and posting its height back out, since an
 * iframe has no idea how tall its content is from the outside.
 */

import { useEffect, useState } from 'react';
import { Modal } from './Dialogs';

/*
 * Wraps the widget in a complete document. The widget is told to use absolute
 * URLs when it calls the backend — relative ones would resolve against
 * about:srcdoc and go nowhere — which the widget documentation already mandates.
 */
function widgetDocument(html: string, id: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      html, body { margin: 0; padding: 0; background: transparent; }
      *, *::before, *::after { box-sizing: border-box; }
      /*
       * A widget that limits its own width sits centred rather than hard
       * against the left edge — the widget rules tell authors to give the root
       * element min-width:80%, so most widgets do not fill. No-op for one that
       * already does.
       */
      [data-widget-root] > * { margin-left: auto; margin-right: auto; }
    </style>
    <script>
      /*
       * The widget API from "widget-rules.md", which forbids widgets from using
       * document.querySelector and friends and tells them to use these instead.
       * Defined in the head, because a widget's own inline script runs while
       * the body is being parsed and would not find it otherwise.
       */
      (function () {
        function root() {
          return document.querySelector('[data-widget-root]') || document.body;
        }
        window.ainiro = {
          get shadow() { return root(); },
          $: function (selector) { return root().querySelector(selector); },
          $$: function (selector) { return Array.from(root().querySelectorAll(selector)); },
          $id: function (id) { return root().querySelector('#' + CSS.escape(id)); },
        };
      })();
    </script>
  </head>
  <body>
    <div data-widget-root>${html}</div>
    <script>
      (function () {
        function postHeight() {
          window.parent.postMessage({
            type: 'widget-height',
            id: ${JSON.stringify(id)},
            height: Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight),
          }, '*');
        }
        // Widgets build themselves after load as often as before it, so the
        // height is reported on every mutation rather than once.
        new MutationObserver(postHeight).observe(document.documentElement, {
          attributes: true, characterData: true, childList: true, subtree: true,
        });
        window.addEventListener('load', postHeight);
        window.addEventListener('resize', postHeight);
        setTimeout(postHeight, 0);
      })();
    </script>
  </body>
</html>`;
}

export default function WidgetDialog(props: { html: string; onClose: () => void }) {

  // Stable per dialog, so a height message can be matched to this widget.
  const [id] = useState(() => 'w' + Math.random().toString(36).slice(2));
  const [height, setHeight] = useState(240);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== 'widget-height' || event.data?.id !== id) {
        return;
      }
      const reported = event.data.height;
      if (typeof reported === 'number' && Number.isFinite(reported)) {
        /*
         * Height follows the content, bounded at both ends.
         *
         * The upper bound is not only about fitting on screen. The frame's
         * height IS the viewport the widget measures itself against, so a
         * widget sized in vh or percentages would otherwise grow without limit
         * - taller frame, taller content, taller frame. Past the cap the widget
         * scrolls inside its own frame.
         *
         * The dialog is 88vh at most and spends roughly 160px of that on its
         * heading, padding and buttons.
         */
        const available = Math.max(240, window.innerHeight * 0.88 - 160);
        setHeight(Math.min(Math.max(120, Math.ceil(reported)), Math.round(available)));
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [id]);

  return (
    <Modal width={900} onClose={props.onClose}>
      <h2 style={{ marginTop: 0 }}>Widget</h2>
      <iframe
        title="Widget"
        /*
         * allow-same-origin sits alongside allow-scripts because widgets call
         * this cloudlet's own API, and an opaque origin would send those
         * requests with a null Origin. Widget HTML is written to /modules/,
         * which only root can do, so it is trusted code either way.
         */
        sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        srcDoc={widgetDocument(props.html, id)}
        /*
         * display:block because an iframe is inline by default, which leaves it
         * sitting on a text baseline with a few pixels of descender gap below.
         */
        style={{ display: 'block', width: '100%', height, border: 0, background: 'transparent' }} />
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
