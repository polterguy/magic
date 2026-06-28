/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import mermaid from 'mermaid';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { BackendService } from 'src/app/services/backend.service';
import { ConfigService } from 'src/app/services/config.service';
import { GeneralService } from 'src/app/services/general.service';
import { OpenAIService } from 'src/app/services/openai.service';
import { TypewriterPlaceholderDirective } from 'src/app/helpers/typewriter-placeholder.directive';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Clipboard } from '@angular/cdk/clipboard';

/**
 * Vibe coding component, allowing the user to instruct the system using natural language.
 */
@Component({
  selector: 'app-vibe-coding',
  templateUrl: './vibe-coding.component.html',
  styleUrls: ['./vibe-coding.component.scss']
})
export class VibeCodingComponent implements OnInit, OnDestroy {

  @ViewChild('outputDiv') private outputDiv!: ElementRef;
  @ViewChildren('outputDiv', { read: ElementRef }) private container!: QueryList<ElementRef>;
  @ViewChild('queryTextarea') queryTextarea!: ElementRef;
  @ViewChild(TypewriterPlaceholderDirective) typewriter!: TypewriterPlaceholderDirective;

  private hubConnection: HubConnection = null;
  private session: string = null;
  public query: string = null;
  private response: string = null;
  private waitingString = '<p><span class="ainiro-dot ainiro-dot-1"></span><span class="ainiro-dot ainiro-dot-2"></span><span class="ainiro-dot ainiro-dot-3"></span></p>';
  messages: any[] = [];
  is_answering: boolean = false;
  frontendUrl: string = null;
  rawFiles: any = null;

  constructor(
    private openAIService: OpenAIService,
    private configService: ConfigService,
    private generalService: GeneralService,
    private clipboard: Clipboard,
    private backendService: BackendService) { }

  ngOnInit() {

    // Initialising frontend URL
    this.frontendUrl = this.backendService.active.url;

    const renderer = {
      link: function (href: string, title: string, text: string) {
        if (text) {
          if (title) {
            return (
              '<a target="_blank" href="' + href + '" title="' + title + '">' + text + '</a>'
            );
          }
          return '<a target="_blank" href="' + href + '">' + text + '</a>';
        }
        return '<a target="_blank" href="' + href + '">' + href + '</a>';
      },

      image: function (href: string, title: string, text: string) {
        const titleAttr = title ? ` title="${title}"` : '';
        const altAttr = text ? ` alt="${text}"` : '';
        return `<img src="${href}"${titleAttr}${altAttr} onerror="this.style.display='none';" />`;
      },

      code: (code: string, language: string) => {
        if (language === 'mermaid') {
          return `<div class="mermaid">${code}</div>`;
        }
        return `<pre class="${language}"><code>${code}</code></pre>`;
      },
    };

    marked.use({
      renderer,
    });

    marked.setOptions({
      highlight: (code, lang) => {
        let validLanguage = 'plaintext';
        if (lang && lang.toLowerCase() !== 'hyperlambda' && hljs.getLanguage(lang)) {
          validLanguage = lang;
        }
        return hljs.highlight(code, { language: validLanguage }).value;
      },
    });
    mermaid.initialize({ startOnLoad: false });
  }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }

  onKeydownEnter(event: any) {

    if (!event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  onFileSelected(e: any) {

    const files = Array.from(e.target.files);
    if (files.length > 5) {
      this.generalService.showFeedback('You can upload a maximum of 5 files!');
      return;
    }
    this.rawFiles = files;
  }

  removeFiles() {
    this.rawFiles = null;
  }

  submit() {

    // Making sure we've actually got a query.
    if (!this.query || this.query === '') {
      return;
    }

    this.typewriter.setStaticPlaceholder('Where the Machine Creates the Code ...');

    // Making sure we don't allow for pushing multiple queries at the same time.
    this.is_answering = true;

    // Making sure we open socket channel if not already open.
    this.ensureSocket(() => {

      this.response = '';
      this.messages.push({
        type: 'human',
        message: this.renderMarkdownWithScriptPassthrough(this.cleanHtml(this.query)),
      });
      this.messages.push({
        type: 'machine',
        message: this.waitingString,
      });
      this.generalService.showLoading();
      this.openAIService.query(
        this.query,
        'default',
        false,
        this.session,
        null,
        true,
        null,
        this.rawFiles).subscribe({

        next: () => {

          this.rawFiles = null;
          this.query = '';
          this.generalService.hideLoading();
          this.scrollToBottom(false);
        },

        error: (error: any) => {

          this.rawFiles = null;
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          this.generalService.hideLoading();
        }
      });
    });
  }

  startCreating() {

    this.query = 'What can you do?';
    this.submit();
  }

  copyMcpUrl() {

    // Copying the OAuth2-protected MCP connection URL (what you paste into an AI agent) to the clipboard.
    this.clipboard.copy(this.backendService.active.url + '/magic/modules/mcp/mcp');
    this.generalService.showFeedback('AI agent (MCP) connection URL copied to your clipboard', 'successMessage');
  }

  /*
   * Private helper methods.
   */

  private ensureSocket(functor: () => void) {

    if (this.hubConnection) {
      functor();
      return;
    }

    // Checking if we've already got an active session
    if (this.session) {
      this.createSocket(functor);
      return;
    }

    // Making sure we create a unique channel for responses to be streamed back to client.
    this.generalService.showLoading();
    this.configService.getGibberish(20, 20).subscribe({

      next: (res: any) => {

        this.session = res.result;
        this.createSocket(functor);
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  private createSocket(functor: () => void) {

    let builder = new HubConnectionBuilder();
    this.hubConnection = builder
      .withUrl(this.backendService.active.url + '/sockets', {
        accessTokenFactory: () => this.backendService.active.token.token,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    // Subscribing to channel messages.
    this.hubConnection.on(this.session, (args) => {
      const obj = JSON.parse(args);
      this.handleSocketMessage(obj);
    });

    // Making sure we track reconnect events
    this.hubConnection.onreconnecting(error => {
      console.warn('SignalR reconnecting...', error);
      this.hubConnection.off(this.session);
      this.hubConnection.on(this.session, (args) => {
         const obj = JSON.parse(args);
         this.handleSocketMessage(obj);
      });
      this.hubConnection.invoke('RejoinSession', this.session);
    });
    this.hubConnection.onclose(error => {
      console.error('SignalR disconnected and could not re-establish a connection');
      console.error(error);
    });


    // Connecting to hub
    this.hubConnection
      .start()
      .then(() => {
        this.generalService.hideLoading();
        functor();
      })
      .catch((error) => {
        this.generalService.showFeedback(
          'Could not connect to socket. Check browser log for details.',
          'errorMessage'
        );
        this.generalService.hideLoading();
        console.log(error);
      });

    // Making sure we set channel to null if disconnected to trigger re-creation of connection.
    this.hubConnection.onclose(() => {
      this.hubConnection = null;
    });
  }

  private handleSocketMessage(msg: any) {

    // Checking if we've got tokens streaming from server.
    if (msg.finished === true) {

      this.is_answering = false;
      setTimeout(() => {
        this.queryTextarea.nativeElement.focus();
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      }, 1);
      this.applySyntaxHighlighting();
      this.scrollToBottom(false);
      this.runScriptsIn(this.outputDiv.nativeElement);

    } else if (msg.error) {

      // Making sure we remove the jumping dots
      if (this.messages[this.messages.length - 1].message.includes(this.waitingString)) {
        this.messages[this.messages.length - 1].message = this.messages[this.messages.length - 1].message.replace(this.waitingString, '');
      }
      this.messages[this.messages.length - 1].message += '<span class="error-message">Something went wrong while trying to invoke the LLM</span>';

      this.is_answering = false;
      setTimeout(() => {
        this.queryTextarea.nativeElement.focus();
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      }, 1);
      this.applySyntaxHighlighting();
      this.scrollToBottom(false);

    } else if (msg.message) {

      // Making sure we remove the jumping dots
      if (this.messages[this.messages.length - 1].message.includes(this.waitingString)) {
        this.messages[this.messages.length - 1].message = this.messages[this.messages.length - 1].message.replace(this.waitingString, '');
      }

      this.response += msg.message;
      this.messages[this.messages.length - 1].message = this.renderMarkdownWithScriptPassthrough(this.cleanHtml(this.response));

    } else if (msg.function_waiting) {

      this.response += '\n\n<span class="function_waiting">Waiting ...</span>\n\n';
      this.messages[this.messages.length - 1].message = this.renderMarkdownWithScriptPassthrough(this.response);
      return;

    } else if (msg.function_result) {

      this.response = this.response.replace(
        '<span class="function_waiting">Waiting ...</span>',
        '<span class="function_succeeded">' + msg.function_result + '</span>\n\n'
      );
      return;

    } else if (msg.function_error) {

      this.response = this.response.replace(
        '<span class="function_waiting">Waiting ...</span>',
        '<span class="function_failed">' + msg.function_error + '</span>\n\n'
      );
      return;

    } else if (msg.type) {

      switch (msg.type) {

        case 'download_file':
          let url = this.backendService.active.url +
            '/magic/system/file-system/file-with-token?access_token=' +
            encodeURIComponent(msg.ticket) +
            '&file=' + encodeURIComponent(msg.filename);
            this.response += `<a href='${url}' target='_blank' class='download_file'>Download</a>`;
          break;

        case 'render_html':
          this.response += '<div class="hljs_ignore">' + msg.html + '</div>';
          break;

        default:
          alert('Unknown client-side binding; \'' + msg.type + '\'');
      }
    }
  }

  private cleanHtml(markdown: string) {
    while (true) {
      if (markdown.indexOf('\r') === -1) {
        break;
      }
      markdown = markdown.replace('\r', '');
    }

    let result = '';
    let splits = markdown.split('\n');
    let insideCode = false;
    for (let idx = 0; idx < splits.length; idx++) {
      let tmp = splits[idx];
      if (tmp.startsWith('```')) {
        insideCode = !insideCode;
        result += tmp + '\n';
      } else {
        if (insideCode) {
          while (true) {
            if (tmp.indexOf('<') === -1 && tmp.indexOf('>') === -1) {
              break;
            }
            tmp = tmp.replace('<', '&lt;');
            tmp = tmp.replace('>', '&gt;');
          }
          result += tmp;
        } else {
          result += tmp;
        }
        result += '\n';
      }
    }

    return result;
  }

  private scrollToBottom(abortIfScrolledUp: boolean = false) {
    setTimeout(() => {
      const el = this.outputDiv?.nativeElement;
      if (el) {
        // If aborting is allowed and the user has scrolled up > 100px, do nothing
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (abortIfScrolledUp && distanceFromBottom > 100) {
          return;
        }

        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  }

  private applySyntaxHighlighting() {

    setTimeout(() => {

      this.container.forEach(container => {

        const codeBlocks = container.nativeElement.querySelectorAll('pre code');

        codeBlocks.forEach((el: HTMLElement) => {

          // Verifying we should not ignore this guy.
          let ignore = false;
          let idxEl = el;
          while (idxEl) {
            if (idxEl.classList.contains('hljs_ignore')) {
              ignore = true;
              break;
            }
            idxEl = idxEl.parentElement;
          }
          if (!ignore && !el.classList.contains('hyperlambda') && !el.parentElement?.classList.contains('hyperlambda')) {
            hljs.highlightElement(el);
          }
        });
      });
    }, 0);
  }

  async runScriptsIn(root: Element): Promise<void> {

    const scripts: HTMLScriptElement[] = Array.from(
      root.querySelectorAll('.hljs_ignore script:not([data-executed])')
    );

    for (const oldScript of scripts) {
      oldScript.setAttribute('data-executed', '1');

      const parent = oldScript.parentNode;
      if (!parent) continue;

      const newScript = document.createElement('script');
      for (const { name, value } of Array.from(oldScript.attributes)) {
        if (name !== 'data-executed') newScript.setAttribute(name, value);
      }

      const isExternal = !!oldScript.src;
      if (!isExternal) newScript.textContent = oldScript.textContent || '';

      const wait = isExternal
        ? new Promise<void>((resolve) => {
            newScript.addEventListener('load', () => resolve(), { once: true });
            newScript.addEventListener('error', (ev) => {
              console.error('External script failed to load:', newScript.src, ev);
              resolve();
            }, { once: true });
          })
        : Promise.resolve();

      try {
        parent.replaceChild(newScript, oldScript);
        await wait;
      } catch (e) {
        console.error('Script execution error:', e, newScript);
      }
    }
  }

  private extractScripts(src: string): { without: string; scripts: Array<{ key: string; html: string }> } {

    const scripts: Array<{ key: string; html: string }> = [];
    const TOKEN = `%%RAW_SCRIPT_${Math.random().toString(36).slice(2)}%%`;
    let i = 0;
    let out = '';
    let pos = 0;

    const findNextFence = (s: string, from: number) => {
      const openRe = /(^|\r?\n)[ \t]*(?:>[ \t]*)*(?:(?:\d+[.)]|[*\-+])[ \t]+)?([`~]{3,})([^\r\n]*)(?:\r?\n|$)/g;

      const slice = s.slice(from);
      const m = openRe.exec(slice);
      if (!m) return null;

      const marks = m[2];           // "```", "~~~~", etc.
      const fChar = marks[0];       // '`' or '~'
      const fLen  = marks.length;   // >= 3

      const openAbsStart = from + m.index + (m[1] ? m[1].length : 0);
      const afterOpen    = from + m.index + m[0].length;
      const fenceCharEsc = fChar === '`' ? '\\`' : '~';
      const closeRe = new RegExp('(^|\\r?\\n)[ \\t]*(?:>[ \\t]*)*' + fenceCharEsc + '{' + fLen + ',}\\s*(?=\\r?\\n|$)', 'g');

      const slice2 = s.slice(afterOpen);
      const m2 = closeRe.exec(slice2);

      const endAbs = m2 ? (afterOpen + m2.index + m2[0].length) : s.length;
      return { start: openAbsStart, end: endAbs };
    };

    const findNextScript = (s: string, from: number) => {

      const re = /<script\b[^>]*>[\s\S]*?<\/script\s*>/i;
      const slice = s.slice(from);
      const m = re.exec(slice);
      if (!m) return null;
      const start = from + m.index;
      const end   = start + m[0].length;
      return { start, end, html: m[0] };
    };

    while (pos < src.length) {

      const fence = findNextFence(src, pos);
      const scr   = findNextScript(src, pos);

      if (!fence && !scr) {
        out += src.slice(pos);
        break;
      }

      // If a fenced block starts before (or at) the next <script>, copy the whole fenced block verbatim
      if (fence && (!scr || fence.start <= scr.start)) {
        out += src.slice(pos, fence.end);
        pos = fence.end;
        continue;
      }

      // Otherwise replace the next <script> (outside fences) with a token
      if (scr) {
        out += src.slice(pos, scr.start);
        const key = `${TOKEN}${i++}__`;
        scripts.push({ key, html: scr.html });
        out += key;
        pos = scr.end;
        continue;
      }
    }

    return { without: out, scripts };
  }

  private restoreScripts(html: string, scripts: Array<{ key: string; html: string }>): string {

    let out = html;
    for (const s of scripts) out = out.split(s.key).join(s.html);
    return out;
  }

  private renderMarkdownWithScriptPassthrough(md: string): string {

    const { without, scripts } = this.extractScripts(md);
    const rendered = (marked as any).parse ? (marked as any).parse(without) : (marked as any)(without);
    return this.restoreScripts(rendered as string, scripts);
  }
}
