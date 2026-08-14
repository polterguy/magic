/*
 * Chat-ops drawer — a conversation with the "default" code-generation model,
 * sliding in over whatever page is active so results can be inspected without
 * leaving the conversation. Stays mounted while closed, so the conversation
 * survives both closing the drawer and navigating between pages.
 *
 * The AI-function loop runs entirely server-side inside the chat pipeline;
 * this component renders its progress as pills, and otherwise just streams
 * tokens from the session's socket channel. Chunk fields are processed
 * independently — one chunk may carry several of them at once.
 */

import { marked } from 'marked';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { createSocket } from '../lib/socket';
import { getTheme } from '../lib/theme';
import {
  ChatChunk, MAX_CHAT_FILES, chatDownloadUrl, chatPrompt, gibberish, killExecution,
} from '../lib/api';
import { copyToClipboard, showToast } from '../lib/toast';
import { CopyIcon, DownloadIcon, FilePlusIcon, PaperclipIcon } from './Icons';

type Segment =
  | { kind: 'text'; text: string }
  | {
      kind: 'function';
      state: 'waiting' | 'success' | 'error';
      // The invoked file, named on the pill, and its arguments or the
      // exception it threw, behind the toggler.
      file?: string;
      detail?: string;
    }
  | { kind: 'html'; html: string }
  | { kind: 'download'; url: string; filename: string };

/*
 * A file on its way out, or already sent. [url] is an object URL for images
 * only, and outlives the send so a message keeps its thumbnail — every one
 * created is revoked when the conversation is cleared or the drawer unmounts.
 */
interface Attachment {
  name: string;
  size: number;
  url?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  segments: Segment[];
  // Files sent along with a user message.
  files?: Attachment[];
}

/*
 * Markdown exactly as the model wrote it, with raw code escaped — fenced
 * blocks get a copy button wired up through event delegation on the message
 * list, since this HTML enters the page as a string.
 */
const renderer = new marked.Renderer();

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// The CopyIcon from Icons.tsx, as markup — this HTML enters the page as a string.
const COPY_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="9" y="9" width="12" height="12" rx="2" />' +
  '<path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></svg>';

renderer.code = ({ text, lang }) => {
  if (lang === 'mermaid') {
    // Placeholder rendered into an SVG once the answer has finished streaming.
    return '<div class="chat-mermaid">' +
      '<code class="chat-mermaid-code" style="display:none">' + escapeHtml(text) + '</code>' +
      '<div class="chat-mermaid-placeholder muted">Rendering diagram…</div></div>';
  }
  const language = lang || 'plaintext';
  return '<div class="chat-code chat-hl">' +
    '<div class="chat-code-header"><span>' + escapeHtml(language) + '</span>' +
    '<button type="button" class="chat-copy-btn" title="Copy code" data-code="' +
    encodeURIComponent(text) + '">' + COPY_SVG + '</button></div>' +
    '<pre><code class="language-' + escapeHtml(language) + '">' +
    escapeHtml(text) + '</code></pre></div>';
};

renderer.codespan = ({ text }) => '<code>' + escapeHtml(text) + '</code>';

renderer.link = function ({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens);
  return '<a href="' + href + '"' + (title ? ' title="' + title + '"' : '') +
    ' target="_blank" rel="noreferrer">' + (text || href) + '</a>';
};

marked.setOptions({ renderer, breaks: true, gfm: true });

/*
 * Mermaid quotes node labels containing special characters — models rarely
 * do, so `A[my (label)]` becomes `A["my (label)"]` before rendering.
 */
function sanitiseMermaid(code: string): string {
  return code.replace(/(\w+)\[([^\]]+)\]/g, (_match: string, id: string, label: string) => {
    const clean = label.replace(/(?:^["'])|(?:["']$)/g, '');
    if (/[()/"'[\]]/.test(clean)) {
      return id + '["' + clean.replace(/"/g, '\\"') + '"]';
    }
    return id + '[' + clean + ']';
  });
}

/*
 * Renders every not-yet-rendered diagram under root. Mermaid is a heavyweight
 * dependency, so it loads on demand the first time a diagram actually shows
 * up, and never rides along in the main bundle.
 */
async function renderMermaidDiagrams(root: HTMLElement, dark: boolean) {
  const containers = root.querySelectorAll('.chat-mermaid:not([data-rendered])');
  if (containers.length === 0) {
    return;
  }
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'default',
    securityLevel: 'loose',
  });
  for (const container of Array.from(containers)) {
    const code = (container.querySelector('.chat-mermaid-code')?.textContent ?? '').trim();
    (container as HTMLElement).dataset.rendered = 'true';
    try {
      const id = 'chat-mermaid-' + Math.random().toString(36).slice(2, 10);
      const { svg } = await mermaid.render(id, sanitiseMermaid(code));
      container.innerHTML = svg;
    } catch {
      // A diagram that doesn't parse still carries information — show the code.
      container.innerHTML = '<pre class="result-json">' + escapeHtml(code) + '</pre>';
    }
  }
}

export default function ChatDrawer(props: {
  open: boolean;
  userId: string;
  onClose: () => void;
}) {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [files, setFiles] = useState<{ file: File; url?: string }[]>([]);
  // Every object URL handed out, so none of them leak.
  const objectUrls = useRef<string[]>([]);
  /*
   * On by default: analysing is the only mode that puts the file contents in
   * front of the model. Uploading merely saves them on the cloudlet and tells
   * the model where they landed, which is the right choice when a function is
   * meant to read them — and the only one that works on localhost, since
   * analysing needs a host the model can fetch from.
   */
  const [analyse, setAnalyse] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  // Session id doubles as the socket channel name; null until the first send.
  const sessionRef = useRef<string | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Escape closes — plain listener, so open dialogs above still get it first.
  useEffect(() => {
    if (!props.open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        props.onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.open, props.onClose]);

  useEffect(() => {
    if (props.open) {
      inputRef.current?.focus();
    }
  }, [props.open]);

  // Follow the stream — chat scrolls to the newest content on every change.
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, streaming]);

  /*
   * Diagrams and syntax highlighting land once the answer has finished
   * streaming — a half-streamed mermaid block is a parse error, and
   * re-highlighting on every token would burn cycles for nothing. Both
   * libraries load on demand, keeping them out of the main bundle.
   */
  useEffect(() => {
    if (streaming || !listRef.current) {
      return;
    }
    const root = listRef.current;
    renderMermaidDiagrams(root, getTheme() === 'dark');
    import('../lib/chatHighlight').then(module => module.highlightUnder(root));
  }, [messages, streaming]);

  useEffect(() => {
    return () => {
      connectionRef.current?.stop().catch(() => {});
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, []);

  function onChunk(chunk: ChatChunk) {
    // Transient status pushed by AI functions while they work.
    if (chunk.floating_message) {
      showToast(chunk.floating_message, chunk.floating_state === 'error');
    }
    const done = !!chunk.finished || !!chunk.error;
    if (done) {
      setStreaming(false);
      setExecutionId(null);
    }
    setMessages(current => {
      const next = [...current];
      let last = next[next.length - 1];
      if (!last || last.role !== 'assistant') {
        // Nothing to attach status-only chunks to — don't invent a bubble.
        if (!chunk.message && !chunk.html && !(chunk.ticket && chunk.filename) &&
            !chunk.function_waiting && !chunk.function_result && !chunk.function_error) {
          return current;
        }
        last = { role: 'assistant', segments: [] };
        next.push(last);
      } else {
        last = { ...last, segments: [...last.segments] };
        next[next.length - 1] = last;
      }
      const segments = last.segments;

      // Every field a chunk carries is processed — never one at the expense of another.
      if (chunk.message) {
        const tail = segments[segments.length - 1];
        if (tail?.kind === 'text') {
          segments[segments.length - 1] = { kind: 'text', text: tail.text + chunk.message };
        } else {
          segments.push({ kind: 'text', text: chunk.message });
        }
      }
      if (chunk.function_waiting) {
        segments.push({ kind: 'function', state: 'waiting' });
      }
      if (chunk.function_result || chunk.function_error) {
        const state = chunk.function_error ? 'error' : 'success';
        // Trimmed — the server's payloads arrive with leading whitespace.
        const detail = [chunk.invocation, chunk.function_error]
          .map(part => part?.trim())
          .filter(Boolean).join('\n\n');
        const waiting = segments.findIndex(
          segment => segment.kind === 'function' && segment.state === 'waiting');
        const resolved: Segment = {
          kind: 'function',
          state,
          file: chunk.file?.trim(),
          detail: detail || undefined,
        };
        if (waiting === -1) {
          segments.push(resolved);
        } else {
          segments[waiting] = resolved;
        }
      }
      if (chunk.ticket && chunk.filename) {
        segments.push({
          kind: 'download',
          url: chatDownloadUrl(chunk.ticket, chunk.filename),
          filename: chunk.filename,
        });
      }
      if (chunk.html) {
        segments.push({ kind: 'html', html: chunk.html });
      }
      if (done) {
        // A spinner must not outlive the conversation — resolve dangling pills.
        segments.forEach((segment, index) => {
          if (segment.kind === 'function' && segment.state === 'waiting') {
            // The name never arrived, so the pill keeps its generic wording.
            segments[index] = {
              kind: 'function',
              state: chunk.error ? 'error' : 'success',
            };
          }
        });
      }
      return next;
    });
  }

  // Chunk handler behind a ref, so the socket subscription never goes stale.
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  async function ensureSession(): Promise<string> {
    if (sessionRef.current) {
      return sessionRef.current;
    }
    const session = (await gibberish()).result;
    if (!connectionRef.current) {
      connectionRef.current = createSocket({ reconnect: true });
      await connectionRef.current.start();
    }
    connectionRef.current.on(session, (raw: string) => {
      try {
        onChunkRef.current(JSON.parse(raw));
      } catch {
        // A chunk that doesn't parse carries nothing we can render.
      }
    });
    sessionRef.current = session;
    return session;
  }

  function addFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) {
      return;
    }
    if (files.length + picked.length > MAX_CHAT_FILES) {
      showToast('At most ' + MAX_CHAT_FILES + ' files per message', true);
      return;
    }
    const added = Array.from(picked).map(file => {
      if (!file.type.startsWith('image/')) {
        return { file };
      }
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      return { file, url };
    });
    setFiles([...files, ...added]);
  }

  function removeFile(index: number) {
    const url = files[index].url;
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.current = objectUrls.current.filter(current => current !== url);
    }
    setFiles(files.filter((_, i) => i !== index));
  }

  async function send() {
    const prompt = input.trim();
    if (!prompt || streaming) {
      return;
    }
    const attached = files;
    setInput('');
    setFiles([]);
    setMessages(current => [...current, {
      role: 'user',
      segments: [{ kind: 'text', text: prompt }],
      // Object URLs carry over to the sent message rather than being revoked.
      files: attached.length > 0
        ? attached.map(entry => ({ name: entry.file.name, size: entry.file.size, url: entry.url }))
        : undefined,
    }]);
    setStreaming(true);
    try {
      const session = await ensureSession();
      const response = await chatPrompt(
        session,
        prompt,
        props.userId,
        attached.length > 0 ? attached.map(entry => entry.file) : undefined,
        attached.length > 0 && !analyse);
      setExecutionId(response?.execution_id ?? null);
    } catch (err: any) {
      setStreaming(false);
      showToast(err.message, true, err.logId);
    }
  }

  async function stop() {
    if (!executionId) {
      return;
    }
    try {
      await killExecution(executionId);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setStreaming(false);
      setExecutionId(null);
    }
  }

  function newChat() {
    if (streaming) {
      return;
    }
    if (sessionRef.current && connectionRef.current) {
      connectionRef.current.off(sessionRef.current);
    }
    sessionRef.current = null;
    setMessages([]);
    setFiles([]);
    // Every thumbnail belonged to the conversation being thrown away.
    objectUrls.current.forEach(URL.revokeObjectURL);
    objectUrls.current = [];
    inputRef.current?.focus();
  }

  // Copy buttons inside marked-rendered HTML, wired through delegation.
  function onListClick(event: React.MouseEvent) {
    const button = (event.target as HTMLElement).closest('.chat-copy-btn');
    if (button) {
      copyToClipboard(decodeURIComponent(button.getAttribute('data-code') ?? ''), 'Code');
    }
  }

  return (
    <aside
      className={'chat-drawer' + (props.open ? ' open' : '')}
      aria-label="Chat with your cloudlet"
      aria-hidden={!props.open}>
      <div className="chat-drawer-header">
        <strong>Chat Ops</strong>
        <span style={{ flex: 1 }} />
        <button
          className="btn btn-ghost btn-small"
          title="New chat"
          disabled={streaming}
          onClick={newChat}>
          <FilePlusIcon />
        </button>
        <button
          className="btn btn-ghost btn-small"
          title="Close (Esc)"
          onClick={props.onClose}>
          ×
        </button>
      </div>
      <div className="chat-messages" ref={listRef} onClick={onListClick}>
        {messages.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>
            Talk to your cloudlet — generate endpoints, query your databases,
            or ask what your backend can do.
          </p>
        )}
        {messages.map((message, index) => {
          const raw = message.segments
            .filter(segment => segment.kind === 'text')
            .map(segment => (segment as { text: string }).text)
            .join('');
          const finished = !(streaming && index === messages.length - 1);
          return (
            <div key={index} className={'chat-message ' + message.role}>
              {message.role === 'assistant' && finished && raw && (
                <button
                  className="icon-btn chat-response-copy"
                  title="Copy response"
                  onClick={() => copyToClipboard(raw, 'Response')}>
                  <CopyIcon />
                </button>
              )}
              {message.segments.map((segment, segmentIndex) => (
                <ChatSegment
                  key={segmentIndex}
                  segment={segment}
                  markdown={message.role === 'assistant'} />
              ))}
              {message.files && (
                <div className="chat-tiles" style={{ marginTop: 10 }}>
                  {message.files.map((file, fileIndex) => (
                    <FileTile key={fileIndex} name={file.name} size={file.size} url={file.url} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {streaming && (
          <div className="muted" style={{ padding: '4px 2px' }}>
            Thinking<span className="spinner-dots" />
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="chat-attachments">
          <div className="chat-tiles">
            {files.map((entry, index) => (
              <FileTile
                key={index}
                name={entry.file.name}
                size={entry.file.size}
                url={entry.url}
                onRemove={() => removeFile(index)} />
            ))}
          </div>
          <div className="chat-mode" role="group" aria-label="How the model should treat the files">
            <button
              type="button"
              className={analyse ? '' : 'active'}
              title="Saves the files on the cloudlet and tells the model where they landed. Works anywhere."
              onClick={() => setAnalyse(false)}>
              Upload
            </button>
            <button
              type="button"
              className={analyse ? 'active' : ''}
              title="Exposes the files over HTTP for the model to read — needs a publicly reachable backend, so not localhost."
              onClick={() => setAnalyse(true)}>
              Analyse
            </button>
          </div>
        </div>
      )}
      <div className="chat-composer">
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
        <button
          className="btn btn-secondary chat-attach"
          title={'Attach files (max ' + MAX_CHAT_FILES + ')'}
          disabled={streaming || files.length >= MAX_CHAT_FILES}
          onClick={() => fileRef.current?.click()}>
          <PaperclipIcon />
        </button>
        <textarea
          ref={inputRef}
          placeholder="Ask the default model…"
          value={input}
          rows={2}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }} />
        {streaming ? (
          <button className="btn btn-secondary" onClick={stop} disabled={!executionId}>
            Stop
          </button>
        ) : (
          <button className="btn" onClick={send} disabled={!input.trim()}>
            Send
          </button>
        )}
      </div>
    </aside>
  );
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  if (bytes >= 1024) {
    return Math.round(bytes / 1024) + ' KB';
  }
  return bytes + ' B';
}

/*
 * One attached file — a thumbnail for images, the extension otherwise.
 * Removable while pending, read-only once the message has been sent.
 */
function FileTile(props: { name: string; size: number; url?: string; onRemove?: () => void }) {

  const extension = props.name.includes('.')
    ? props.name.split('.').pop()!.toUpperCase().slice(0, 4)
    : 'FILE';
  return (
    <div className="chat-tile" title={props.name}>
      <div className="chat-tile-preview">
        {props.url
          ? <img src={props.url} alt={props.name} />
          : <span className="chat-tile-ext">{extension}</span>}
        {props.onRemove && (
          <button
            type="button"
            className="chat-tile-remove"
            title={'Remove ' + props.name}
            onClick={props.onRemove}>
            ×
          </button>
        )}
      </div>
      <span className="chat-tile-name">{props.name}</span>
      <span className="chat-tile-size">{formatSize(props.size)}</span>
    </div>
  );
}

function ChatSegment({ segment, markdown }: { segment: Segment; markdown: boolean }) {

  // Collapsed by default — the pill is the summary, the payload one click away.
  const [showDetail, setShowDetail] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  /*
   * The invocation is JSON, so it gets the same treatment as code in answers.
   * Highlighting happens here rather than in the drawer's pass, since opening
   * a pill is local state the drawer never sees.
   */
  useEffect(() => {
    const root = detailRef.current;
    if (showDetail && root) {
      import('../lib/chatHighlight').then(module => module.highlightUnder(root));
    }
  }, [showDetail]);
  const html = useMemo(
    () => segment.kind === 'text' && markdown ? marked.parse(segment.text) as string : '',
    [segment, markdown]);

  switch (segment.kind) {
    case 'text':
      return markdown
        ? <div className="chat-text chat-markdown" dangerouslySetInnerHTML={{ __html: html }} />
        : <div className="chat-text">{segment.text}</div>;
    case 'function': {
      const expandable = !!segment.detail;
      return (
        <div className="chat-function">
          <button
            type="button"
            className={'chat-pill chat-pill-' + segment.state}
            disabled={!expandable}
            aria-expanded={expandable ? showDetail : undefined}
            title={expandable ? 'Show the invocation' : undefined}
            onClick={() => setShowDetail(current => !current)}>
            {segment.state === 'waiting' && <>Executing function<span className="spinner-dots" /></>}
            {segment.state === 'success' && <>✓ {segment.file ?? 'Function executed'}</>}
            {segment.state === 'error' && <>✕ {segment.file ?? 'Function failed'}</>}
            {expandable && (
              <span className="chat-pill-caret" aria-hidden="true">
                {showDetail ? '▾' : '▸'}
              </span>
            )}
          </button>
          {showDetail && segment.detail && (
            <div className="chat-function-detail chat-hl" ref={detailRef}>
              <pre><code className="language-json">{segment.detail}</code></pre>
            </div>
          )}
        </div>
      );
    }
    case 'html':
      return <div className="chat-html" dangerouslySetInnerHTML={{ __html: segment.html }} />;
    case 'download':
      return (
        <a
          className="btn btn-secondary btn-small chat-download"
          href={segment.url}
          target="_blank"
          rel="noreferrer"
          title={segment.filename}>
          <DownloadIcon /> {segment.filename.split('/').pop()}
        </a>
      );
  }
}
