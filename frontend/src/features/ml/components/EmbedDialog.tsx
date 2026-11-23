/*
 * Embed dialog — builds the include-script for the modern chatbot.
 * Legacy classic-chatbot and AI-search embeds are intentionally dropped.
 */

import { backendInfo } from '@shared/api';
import { copyToClipboard } from '@shared/lib/toast';
import { Modal } from '@shared/ui/Dialogs';
import OptionPill from '@shared/ui/OptionPill';
import Select from '@shared/ui/Select';
import { useEffect, useState } from 'react';

import { openaiThemes } from '../lib/api';

function boolParam(name: string, value: boolean) {
  return name + '=' + (value ? 'true' : 'false');
}

export default function EmbedDialog(props: Readonly<{ type: string; onClose: () => void }>) {
  const backend = backendInfo();
  const [modernThemes, setModernThemes] = useState<string[]>([]);
  // The script last put on the clipboard, so the button can tell whether it is still current.
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // Modern chatbot options (old-dashboard defaults).
  const [modernTheme, setModernTheme] = useState('modern-square');
  const [header, setHeader] = useState('Ask about our services or products');
  const [buttonText, setButtonText] = useState('AI Chatbot');
  const [placeholder, setPlaceholder] = useState('Ask me anything ...');
  const [position, setPosition] = useState('right');
  const [animation, setAnimation] = useState('none');
  const [references, setReferences] = useState(false);
  const [followUp, setFollowUp] = useState(true);
  const [copyButton, setCopyButton] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [history, setHistory] = useState(false);
  const [attachments, setAttachments] = useState(false);
  const [startColor, setStartColor] = useState('#7892e5');
  const [endColor, setEndColor] = useState('#142660');
  const [foreColor, setForeColor] = useState('#fefefe');
  const [linkColor, setLinkColor] = useState('#fe8464');

  useEffect(() => {
    openaiThemes()
      .then(list => setModernThemes((list ?? []).filter(theme => theme.startsWith('modern'))))
      .catch(() => {});
  }, []);

  function buildChatbot() {
    const e = encodeURIComponent;
    let url =
      backend.url +
      '/magic/system/openai/include-chatbot.js?' +
      [
        boolParam('rtl', rtl),
        boolParam('follow_up', followUp),
        boolParam('copyButton', copyButton),
        boolParam('references', references),
        'position=' + e(position),
        'type=' + e(props.type),
        'header=' + e(header),
        'button=' + e(buttonText),
        'placeholder=' + e(placeholder),
        'color=' + e(foreColor),
        'start=' + e(startColor),
        'end=' + e(endColor),
        'link=' + e(linkColor),
        'theme=' + e(modernTheme),
      ].join('&');
    if (animation !== 'none') {
      url += '&animation=' + animation;
    }
    if (sticky) {
      url += '&sticky=true';
    }
    if (history) {
      url += '&history=true';
    }
    if (attachments) {
      url += '&attachments=true';
    }
    return '<script src="' + url + '" defer></' + 'script>';
  }

  const script = buildChatbot();

  /*
   * Changing any option makes the copied script stale — the button falls back
   * to its normal label so it doesn't claim an outdated embed is on the
   * clipboard.
   */
  const copied = copiedScript === script;

  return (
    <Modal
      size="lg"
      onClose={props.onClose}
      title={'Embed ' + props.type}
      subtitle="Style the chatbot, then paste the script into your website."
      actions={
        <>
          <button
            className="btn btn-secondary"
            onClick={() => {
              void copyToClipboard(script, 'The embed script');
              setCopiedScript(script);
            }}
          >
            {copied ? 'Copied!' : 'Copy embed code'}
          </button>
          <button className="btn" onClick={props.onClose}>
            Done
          </button>
        </>
      }
    >
      <section className="modal-section">
        <div className="modal-section-title">Look</div>
        <div className="form-cols-2">
          <label>
            Theme
            <Select value={modernTheme} onChange={value => setModernTheme(value)}>
              {modernThemes.length === 0 && <option value="modern-square">modern-square</option>}
              {modernThemes.map(theme => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Header <input type="text" value={header} onChange={e => setHeader(e.target.value)} />
          </label>
          <label>
            Button text{' '}
            <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} />
          </label>
          <label>
            Input placeholder{' '}
            <input type="text" value={placeholder} onChange={e => setPlaceholder(e.target.value)} />
          </label>
          <label>
            Position
            <Select value={position} onChange={value => setPosition(value)}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </Select>
          </label>
          <label>
            Animation
            <Select value={animation} onChange={value => setAnimation(value)}>
              <option value="none">None</option>
              <option value="scaleUp">Scale up</option>
              <option value="slideInBottom">Slide in from bottom</option>
              <option value="fadeIn">Fade in</option>
            </Select>
          </label>
        </div>
        <div className="form-cols-4">
          <label>
            Gradient start{' '}
            <input type="color" value={startColor} onChange={e => setStartColor(e.target.value)} />
          </label>
          <label>
            Gradient end{' '}
            <input type="color" value={endColor} onChange={e => setEndColor(e.target.value)} />
          </label>
          <label>
            Foreground{' '}
            <input type="color" value={foreColor} onChange={e => setForeColor(e.target.value)} />
          </label>
          <label>
            Links{' '}
            <input type="color" value={linkColor} onChange={e => setLinkColor(e.target.value)} />
          </label>
        </div>
      </section>
      <section className="modal-section">
        <div className="modal-section-title">Features</div>
        <div className="pill-row">
          <OptionPill label="References" checked={references} onChange={setReferences} />
          <OptionPill label="Follow-up questions" checked={followUp} onChange={setFollowUp} />
          <OptionPill label="Copy button" checked={copyButton} onChange={setCopyButton} />
          <OptionPill label="Right-to-left" checked={rtl} onChange={setRtl} />
          <OptionPill label="Sticky" checked={sticky} onChange={setSticky} />
          <OptionPill label="History" checked={history} onChange={setHistory} />
          <OptionPill label="Attachments" checked={attachments} onChange={setAttachments} />
        </div>
      </section>
      <section className="modal-section">
        <div className="modal-section-title">Embed script</div>
        <pre className="result-json" style={{ whiteSpace: 'pre-wrap' }}>
          {script}
        </pre>
      </section>
    </Modal>
  );
}
