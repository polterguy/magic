/*
 * Embed dialog — builds the include-script for the modern chatbot.
 * Legacy classic-chatbot and AI-search embeds are intentionally dropped.
 */

import { useEffect, useState } from 'react';
import { Modal } from '../../components/Dialogs';
import Select from '../../components/Select';
import { backendInfo, openaiThemes } from '../../lib/api';
import { copyToClipboard } from '../../lib/toast';

function boolParam(name: string, value: boolean) {
  return name + '=' + (value ? 'true' : 'false');
}

export default function EmbedDialog(props: { type: string; onClose: () => void }) {

  const backend = backendInfo();
  const [modernThemes, setModernThemes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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
    let url = backend.url + '/magic/system/openai/include-chatbot.js?' + [
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
  useEffect(() => setCopied(false), [script]);

  return (
    <Modal width={680} onClose={props.onClose}>
      <h2>Embed {props.type}</h2>
      <div style={{ maxHeight: '55vh', overflow: 'auto', paddingRight: 6 }}>
        <div className="form-grid">
            <label>Theme
              <Select value={modernTheme} onChange={value => setModernTheme(value)}>
                {modernThemes.length === 0 && <option value="modern-square">modern-square</option>}
                {modernThemes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </Select>
            </label>
            <label>Header
              <input type="text" value={header} onChange={e => setHeader(e.target.value)} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>Button text
                <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} />
              </label>
              <label>Input placeholder
                <input type="text" value={placeholder} onChange={e => setPlaceholder(e.target.value)} />
              </label>
              <label>Position
                <Select value={position} onChange={value => setPosition(value)}>
                  <option value="right">right</option>
                  <option value="left">left</option>
                </Select>
              </label>
              <label>Animation
                <Select value={animation} onChange={value => setAnimation(value)}>
                  <option value="none">none</option>
                  <option value="scaleUp">scaleUp</option>
                  <option value="slideInBottom">slideInBottom</option>
                  <option value="fadeIn">fadeIn</option>
                </Select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <label style={{ fontSize: 12 }}>Gradient start
                <input type="color" value={startColor} onChange={e => setStartColor(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Gradient end
                <input type="color" value={endColor} onChange={e => setEndColor(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Foreground
                <input type="color" value={foreColor} onChange={e => setForeColor(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Links
                <input type="color" value={linkColor} onChange={e => setLinkColor(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['References', references, setReferences],
                ['Follow-up questions', followUp, setFollowUp],
                ['Copy button', copyButton, setCopyButton],
                ['Right-to-left', rtl, setRtl],
                ['Sticky', sticky, setSticky],
                ['History', history, setHistory],
                ['Attachments', attachments, setAttachments],
              ].map(([label, value, setter]: any) => (
                <label key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={value} onChange={e => setter(e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            Paste this into your website
          </div>
          <pre className="result-json" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {script}
          </pre>
        </div>
      </div>
      <div className="modal-actions">
        <button
          className="btn btn-secondary"
          onClick={() => { copyToClipboard(script, 'The embed script'); setCopied(true); }}>
          {copied ? 'Copied!' : 'Copy embed code'}
        </button>
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
