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
import { ChatChunk, chatDownloadUrl, chatPrompt, gibberish, killExecution } from '../lib/api';
import { copyToClipboard, showToast } from '../lib/toast';
import { CopyIcon, DownloadIcon, FilePlusIcon } from './Icons';

type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'function'; state: 'waiting' | 'success' | 'error'; label?: string; detail?: string }
  | { kind: 'html'; html: string }
  | { kind: 'download'; url: string; filename: string };

interface ChatMessage {
  role: 'user' | 'assistant';
  segments: Segment[];
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
  return '<div class="chat-code">' +
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
        // The server sends a short label; the payload rides in [invocation]/[file].
        const label = chunk.function_error
          ? truncate(chunk.function_error, 48)
          : chunk.function_result;
        const detail = [
          chunk.file,
          chunk.invocation,
          chunk.function_error,
        ].filter(Boolean).join('\n\n');
        const waiting = segments.findIndex(
          segment => segment.kind === 'function' && segment.state === 'waiting');
        const resolved: Segment = { kind: 'function', state, label, detail: detail || undefined };
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
            segments[index] = {
              kind: 'function',
              state: chunk.error ? 'error' : 'success',
              label: chunk.error ? 'Interrupted' : 'Done',
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

  async function send() {
    const prompt = input.trim();
    if (!prompt || streaming) {
      return;
    }
    setInput('');
    setMessages(current => [...current, { role: 'user', segments: [{ kind: 'text', text: prompt }] }]);
    setStreaming(true);
    try {
      const session = await ensureSession();
      const response = await chatPrompt(session, prompt, props.userId);
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
            </div>
          );
        })}
        {streaming && (
          <div className="muted" style={{ padding: '4px 2px' }}>
            Thinking<span className="spinner-dots" />
          </div>
        )}
      </div>
      <div className="chat-composer">
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

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function ChatSegment({ segment, markdown }: { segment: Segment; markdown: boolean }) {

  // Collapsed by default — the pill is the summary, the payload one click away.
  const [showDetail, setShowDetail] = useState(false);
  const html = useMemo(
    () => segment.kind === 'text' && markdown ? marked.parse(segment.text) as string : '',
    [segment, markdown]);

  switch (segment.kind) {
    case 'text':
      return markdown
        ? <div className="chat-text chat-markdown" dangerouslySetInnerHTML={{ __html: html }} />
        : <div className="chat-text">{segment.text}</div>;
    case 'function':
      return (
        <div className="chat-function">
          <button
            type="button"
            className={'chat-pill chat-pill-' + segment.state}
            disabled={!segment.detail}
            aria-expanded={segment.detail ? showDetail : undefined}
            title={segment.detail ? 'Show invocation' : undefined}
            onClick={() => setShowDetail(current => !current)}>
            {segment.state === 'waiting' && <>Executing function<span className="spinner-dots" /></>}
            {segment.state === 'success' && <>✓ {segment.label ?? 'Function executed'}</>}
            {segment.state === 'error' && <>✕ {segment.label ?? 'Function failed'}</>}
          </button>
          {showDetail && segment.detail && (
            <pre className="result-json chat-function-detail">{segment.detail}</pre>
          )}
        </div>
      );
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
