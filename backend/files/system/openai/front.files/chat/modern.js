/*
 * Modern JavaScript file for OpenAI chat inclusion.
 */
(function() {

  // Avoiding double inclusion issues.
  if (window.ainiro) {
    return;
  }

  // Creating our shadow DOM element.
  const host = document.createElement('ainiro-chatbot');
  document.body.appendChild(host);

  class AiniroChatbotEl extends HTMLElement {
    constructor() {
      super();
      this.root = this.attachShadow({ mode: 'open' });
    }
  }
  customElements.define('ainiro-chatbot', AiniroChatbotEl);

  // Global handler to make sure we delete session list popup if anything is clicked in document.
  document.addEventListener("click", function () {
    if (window.ainiro && window.ainiro.shadow) {
      const inShadow = window.ainiro.shadow.querySelector('.ainiro_sessions_list');
      if (inShadow && inShadow.parentNode) {
        inShadow.parentNode.removeChild(inShadow);
      }
    }
  });

  // Creating our primary namespace.
  window.ainiro = {

    // Shadow helpers.
    shadow: host.shadowRoot || host.attachShadow({ mode: 'open' }),
    $: function(sel) { return ainiro.shadow.querySelector(sel); },
    $$: function(sel) { return Array.from(ainiro.shadow.querySelectorAll(sel)); },
    $id: function(id) { return ainiro.shadow.getElementById(id); },

    /*
     * Settings for chatbot.
     *
     * These settings are dynamically substituded as the script is requested from the server.
     */
    ainiro_settings: {
      url: '[[url]]',
      button: '[[button]]',
      header: `[[header]]`,
      greeting: `[[greeting]]`,
      rtl: [[rtl]],
      references: [[references]],
      type: '[[type]]',
      watermark: `[[ainiro_watermark]]`,
      version: '[[version]]',
      recaptcha: '[[recaptcha]]',
      color: '[[color]]',
      start: '[[start]]',
      end: '[[end]]',
      link: '[[link]]',
      theme: '[[theme]]',
      placeholder: '[[placeholder]]',
      position: '[[position]]',
      clearButton: [[clear_button]],
      copyButton: [[copy_button]],
      follow_up: [[follow_up]],
      new_tab: [[new_tab]],
      code: [[code]],
      animation: '[[animation]]',
      popup: '[[popup]]',
      extra: '[[extra]]',
      hidden: [[hidden]],
      sticky: [[sticky]],
      attachments: [[attachments]],
      history: [[history]],
      meta: '[[meta]]'
    },

    // References buffer for storing references during invocation.
    references_list: [],

    /*
     * SignalR socket connection to backend.
     */
    socket: null,

    /*
     * If true, we need to initialize session by running through questionnaires.
     */
    execQuestionnaires: true,

    /*
     * If true, we need to initialise session with greeting, and conversation starters.
     */
    initSession: true,

    /*
     * Callback function to be invoked when server is finished answering question.
     */
    onFinished: null,

    /*
     * User ID.
     */
    userId: null,

    /*
     * True if user has asked the chatbot questions already.
     */
    hasSessionItems: false,

    /*
     * Temporary response from server.
     */
    responseBuffer: null,

    /*
     * Initializing chatbot.
     *
     * Includes required JavaScript and CSS files, for then to create the UI for the chatbot button
     * and the chatbot window.
     */
    init: function() {

      /*
       * Figuring out theme to use.
       *
       * Notice, this little trickery allows us to create a global callback override
       * that returns the theme we should use, allowing for theme selectors, etc.
       */
      const theme = window.getAiniroChatbotCssFile ?
        (window.getAiniroChatbotCssFile() ?? this.ainiro_settings.theme) :
        this.ainiro_settings.theme;

      /*
       * Including CSS files required for chatbot.
       * (Load inside shadow root to isolate styles.)
       * 
       * Notice, our little injectShadowCSS function
       */
      let styleUrl = `${this.ainiro_settings.url}/magic/system/openai/include-style.css?`;
      styleUrl += `file=${encodeURIComponent(theme)}&`;
      styleUrl += `position=${encodeURIComponent(this.ainiro_settings.position)}&`;
      styleUrl += `color=${encodeURIComponent(this.ainiro_settings.color)}&`;
      styleUrl += `link=${encodeURIComponent(this.ainiro_settings.link)}&`;
      styleUrl += `start=${encodeURIComponent(this.ainiro_settings.start)}&`;
      styleUrl += `end=${encodeURIComponent(this.ainiro_settings.end)}&`;
      styleUrl += `v=${encodeURIComponent(this.ainiro_settings.version)}`;
      this.injectShadowCSS(this.shadow, styleUrl);

      // Ensuring we're using correct icons for buttons.
      const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: 'AiniroIcoFont';
            font-style: normal;
            font-weight: 400;
            src: url('https://ainiro.io/assets/css/fonts/icofont.woff2?v=22.0.0') format('woff2'), url('https://ainiro.io/assets/css/fonts/icofont.woff?v=22.0.0') format('woff');
            font-display: swap;
          }`;
      document.head.appendChild(style);

      // Creating chatbot trigger button that opens chatbot.
      const chatButton = document.createElement('button');
      chatButton.className = 'ainiro ainiro_' + this.ainiro_settings.position;
      if (this.ainiro_settings.animation !== '') {
        chatButton.classList.add(this.ainiro_settings.animation);
      }
      if (this.ainiro_settings.button === '') {
        chatButton.innerHTML = '<i class="ainiro-icofont ainiro-icofont-chat"></i>';
      } else {
        chatButton.innerHTML = this.ainiro_settings.button;
      }
      chatButton.style.display = 'none';
      chatButton.id = 'ainiro_chat_btn';
      chatButton.addEventListener('click', () => this.show());
      if (this.ainiro_settings.rtl) {

        // Chatbot button should be rendered RTL (Farsi, Hebrew, Arabic, etc).
        chatButton.style.direction = 'rtl';
      }

      // Checking if chatbot should be invisible
      if (this.ainiro_settings.hidden === true) {
        chatButton.classList.add('ainiro_hidden');
      }

      // Checking if we need to create a popup for button.
      if (this.ainiro_settings.popup && this.ainiro_settings.popup !== '') {
        chatButton.classList.add('ainiro_popup');
        chatButton.style.setProperty('--ainiro-dynamic-content', '"' + this.ainiro_settings.popup + '"');
      }

      // Appending button to shadow.
      this.shadow.appendChild(chatButton);

      /*
       * Creating chatbot window.
       */
      const chatWindow = document.createElement('div');
      chatWindow.className = 'ainiro ainiro_' + this.ainiro_settings.position;
      chatWindow.id = 'ainiro_chat_wnd';
      chatWindow.style.display = 'none';
      if (this.ainiro_settings.rtl) {
        chatWindow.style.direction = 'rtl';
      }
      this.shadow.appendChild(chatWindow);

      // Creating top toolbar.
      const toolbar = document.createElement('div');
      toolbar.className = 'ainiro_toolbar';
      chatWindow.appendChild(toolbar);

      // Creating window header.
      const header = document.createElement('div');
      header.className = 'ainiro_header';
      header.innerHTML = this.ainiro_settings.header;
      toolbar.appendChild(header);

      // Checking if we should render a "clear session" button.
      if (this.ainiro_settings.clearButton) {

        // Creating "clear session" button.
        const clearChatButton = document.createElement('button');
        clearChatButton.innerHTML = '<i class="ainiro-icofont-duotone ainiro-icofont-purge"></i>';
        clearChatButton.className = 'ainiro_action ainiro_new_chat';
        clearChatButton.addEventListener('click', () => this.clear());
        clearChatButton.style.color = this.ainiro_settings.color;
        toolbar.appendChild(clearChatButton);
      }

      // Creating maximize chat window button.
      const maximizeButton = document.createElement('button');
      maximizeButton.innerHTML = '<i class="ainiro-icofont ainiro-icofont-duotone ainiro-icofont-expand-full"></i><i class="ainiro-icofont ainiro-icofont-duotone ainiro-icofont-contract-alt"></i>';
      maximizeButton.className = 'ainiro_action ainiro_maximize';
      maximizeButton.addEventListener('click', () => this.maximize());
      toolbar.appendChild(maximizeButton);

      // Checking if we should store sessions.
      if (this.ainiro_settings.history === true) {
        const sessionButton = document.createElement('button');
        sessionButton.innerHTML = '<i class="ainiro-icofont ainiro-icofont-duotone ainiro-icofont-list"></i>';
        sessionButton.className = 'ainiro_action ainiro_sessions';
        sessionButton.addEventListener('click', () => this.showSession());
        toolbar.appendChild(sessionButton);
      }

      // Creating close chat window button.
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '<i class="ainiro-icofont ainiro-icofont-close"></i>';
      closeButton.className = 'ainiro_action ainiro_close';
      closeButton.addEventListener('click', () => this.hide());
      toolbar.appendChild(closeButton);

      // Creating chat surface.
      const chatSurface = document.createElement('div');
      chatSurface.className = 'ainiro_chat_surface';
      chatSurface.id = 'ainiro_chat_surf';
      chatWindow.appendChild(chatSurface);

      // Checking if we should display watermark.
      if (this.ainiro_settings.watermark && this.ainiro_settings.watermark !== '') {

        // Displaying watermark.
        const water = document.createElement('div');
        water.className = 'ainiro_watermark';
        water.innerHTML = this.ainiro_settings.watermark;
        chatSurface.appendChild(water);
      }

      // Creating attachment buttons before file input such that we can access it in callback function.
      const attBtn = document.createElement('button');
      const attRem = document.createElement('button');

      // Creating chatbot form including input textbox and submit button.
      const chatForm = document.createElement('form');
      chatForm.id = 'ainiro_form';
      chatForm.className = 'ainiro_form';
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        attBtn.classList.remove('ainiro_hidden');
        attRem.classList.add('ainiro_hidden');
        this.submit();
      });

      // Prompt textbox.
      const textBox = document.createElement('input');
      textBox.id = 'ainiro_txt';
      textBox.className = 'ainiro_query';
      textBox.autocomplete = 'off';
      textBox.type = 'text';
      textBox.placeholder = this.ainiro_settings.placeholder;
      chatForm.appendChild(textBox);

      // Attachments button.
      if (this.ainiro_settings.attachments === true) {

        // Show filename label.
        const lbl = document.createElement('div');
        lbl.className = 'ainiro_filename';
        lbl.id = 'ainiro_filename_label';
        chatWindow.appendChild(lbl);

        // File upload control.
        const fileInp = document.createElement('input');
        fileInp.id = 'ainiro_upload';
        fileInp.type = 'file';
        fileInp.style.display = 'none';
        fileInp.accept = '.csv,.xml,.yaml,.yml,.json,.txt,.md,.html,.htm,.css,.js,.py,.rb,.ts,.scss,.sql,.pdf,.docx,.png,.jpeg,.jpg,.webp,.gif';
        fileInp.addEventListener('change', (ev) => {
          const files = Array.from(ev.target.files);
          this.rawFiles = files;
          attBtn.classList.add('ainiro_hidden');
          attRem.classList.remove('ainiro_hidden');
          lbl.innerHTML = ev.target.files[0].name;
        });
        chatForm.appendChild(fileInp);

        // Add attachments button.
        attBtn.id = 'ainiro_attachments';
        attBtn.className = 'ainiro_attachments';
        attBtn.type = 'button';
        attBtn.addEventListener('click', () => {
          fileInp.click();
        });
        attBtn.innerHTML = '<i class="ainiro-icofont-upload ainiro-icofont-lg"></i>';
        chatForm.appendChild(attBtn);

        // Remove attachments button.
        attRem.id = 'ainiro_delete_attachments';
        attRem.className = 'ainiro_attachments ainiro_hidden';
        attRem.type = 'button';
        attRem.addEventListener('click', () => {
          this.rawFiles = null;
          attBtn.classList.remove('ainiro_hidden');
          attRem.classList.add('ainiro_hidden');
          fileInp.value = null;

          // Removing text of upload file button.
          const l2 = this.shadow.getElementById('ainiro_filename_label');
          if (l2) {
            l2.innerHTML = '';
          }
        });
        attRem.innerHTML = '<i class="ainiro-icofont-duotone ainiro-icofont-purge ainiro-icofont-lg"></i>';
        chatForm.appendChild(attRem);
      }

      // Submit prompt button.
      const submitButton = document.createElement('button');
      submitButton.id = 'ainiro_send';
      submitButton.className = 'ainiro_send';
      submitButton.type = 'submit';
      submitButton.innerHTML = '<i class="ainiro-icofont-location-arrow ainiro-icofont-lg"></i>';
      chatForm.appendChild(submitButton);

      // Adding actual form to DOM.
      chatWindow.appendChild(chatForm);

      /*
       * Checking if we've got something in our session storage
       */
      const sessionItems = sessionStorage.getItem('ainiro_chatbot.session');
      if (sessionItems && sessionItems !== '') {

        // We've got an existing session and user have already asked at least one question.
        chatSurface.innerHTML = sessionItems;
        this.runScriptsIn(this.shadow.getElementById('ainiro_chat_surf'));

        // This prevents questionnaires from being shown.
        this.execQuestionnaires = false;

        // This prevents the watermark, greeting, and conversation starters from being shown.
        this.initSession = false;

        // Making sure surface is scrolled to the bottom when opened.
        this.hasSessionItems = true;
      }

      // Making sure we close chatbot with ESC.
      textBox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {

          // User clicked escape key on keyboard while prompt textbox had focus.
          this.hide();
        }
      });

      // Checking if we already have a user ID, and if so, reusing it.
      const userId = localStorage.getItem('ainiroUserId');
      if (userId) {

        // Using existing user ID.
        this.userId = userId;

      } else {

        // Creating a new user ID.
        this.userId = 'u_' + Date.now() + Math.random();
        localStorage.setItem('ainiroUserId', this.userId);
      }

      // Creating a unique session.
      this.session = 'c_' + Date.now() + Math.random();

      setTimeout(() => {

        // Checking if we've got a query parameter that should trigger the chatbot immediately.
        const urlParams = new URLSearchParams(window.location.search);
        const initialPrompt = urlParams.get('ainiro_prompt');
        if (initialPrompt && initialPrompt !== '') {
          ainiro_faq_question(null, initialPrompt);
        }
      }, 1);

      // Checking if we should show the chatbot by default.
      if (this.ainiro_settings.sticky === true) {
        const ses = sessionStorage.getItem('ainiro_state');
        if (ses === 'open') {
          this.show();
        }
      } else {
        sessionStorage.setItem('ainiro_state', 'closed');
      }
    },

    /*
     * Deletes DOM elements associated with chatbot, and cleans up DOM
     */
    destroy: function() {

      const wnd = this.shadow.getElementById('ainiro_chat_wnd');
      wnd.parentElement.removeChild(wnd);
      const btn = this.shadow.getElementById('ainiro_chat_btn');
      btn?.parentElement.removeChild(btn);
      sessionStorage.setItem('ainiro_state', 'closed');
    },

    /*
     * Correctly injects @import statements from original CSS into root, and the rest of the CSS into our shadow DOM.
     * This allows us to create CSS files importing fonts for instance.
     */
    injectShadowCSS: async function(shadowRoot, styleUrl) {

      // Fetching CSS file.
      const res = await fetch(styleUrl, { mode: 'cors' });
      let cssText = await res.text();

      // Finding @import statements
      const importRegex = /@import\s+url\(["']?([^"')]+)["']?\)[^;]*;/g;

      // Adding all @import statements to head of document.
      let match;
      while ((match = importRegex.exec(cssText)) !== null) {
        const importUrl = match[1];
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = importUrl;
        document.head.appendChild(link);
      }

      // Replacing all @import statements with empty text.
      cssText = cssText.replace(importRegex, '');

      // Adding style as inline style into DOM.
      const style = document.createElement('style');
      style.textContent = cssText;
      shadowRoot.appendChild(style);
    },

    /*
     * Shows the chat window.
     */
    show: function(onAfter = null) {

      // Hiding chat button.
      const btn = this.shadow.getElementById('ainiro_chat_btn');
      if (btn) {
        btn.classList.add('ainiro_hide');
        btn.classList.add('ainiro_shown');
      }

      this.includeResources(() => {

        // Now we can safely invoke our real show function.
        this._show(() => {
          if (onAfter) {
            onAfter();
          }

          // Disabling button to avoid race conditions.
          const sb = this.shadow.getElementById('ainiro_send');
          sb.disabled = false;

          // Storing the fact the chatbot is open into session, in case we've got a "sticky" chatbot.
          sessionStorage.setItem('ainiro_state', 'open');
        });
      });
    },

    /*
     * Includes JS libraries.
     */
    includeResources: function(onAfter) {

      // Invoked after Marked has been downloaded.
      const afterMarked = () => {

        // Checking if we're supposed to open up hyperlinks in new tabs.
        if (this.ainiro_settings.new_tab) {

          // We're opening up hyperlinks in different tabs.
          const renderer = {
            link: function(href, title, text) {
              if (text) {
                if (title) {
                  return '<a target="_blank" href="'+ href +'" title="' + title + '">' + text + '</a>';
                }
                return '<a target="_blank" href="'+ href +'">' + text + '</a>';
              }
              return '<a target="_blank" href="'+ href +'">' + href + '</a>';
            }
          };
          marked.use({
            renderer,
            tokenizer: {
              html(src) {
                // 1) Verify the *opening* tag is a div whose class contains hljs_ignore
                const openTagRe = /^<div[^>]*\bclass=(["'])(?:(?!\1).)*\bhljs_ignore\b(?:(?!\1).)*\1[^>]*>/i;

                const open = src.match(openTagRe);
                if (!open) return false;

                let depth = 1;
                let idx = open[0].length;

                const divTagRe = /<\/?div\b[^>]*>/gi;
                divTagRe.lastIndex = idx;

                let m;
                while ((m = divTagRe.exec(src))) {
                  if (m[0][1] === '/') {
                    depth--;
                  } else {
                    depth++;
                  }
                  if (depth === 0) {
                    const end = divTagRe.lastIndex;
                    const raw = src.slice(0, end);
                    return { type: 'html', raw, text: raw, pre: false, block: true };
                  }
                }

                return false;
              },
            },
          });
        } else {

          marked.use({
            tokenizer: {
              html(src) {
                // 1) Verify the *opening* tag is a div whose class contains hljs_ignore
                const openTagRe = /^<div[^>]*\bclass=(["'])(?:(?!\1).)*\bhljs_ignore\b(?:(?!\1).)*\1[^>]*>/i;

                const open = src.match(openTagRe);
                if (!open) return false;

                let depth = 1;
                let idx = open[0].length;

                const divTagRe = /<\/?div\b[^>]*>/gi;
                divTagRe.lastIndex = idx;

                let m;
                while ((m = divTagRe.exec(src))) {
                  if (m[0][1] === '/') {
                    depth--;
                  } else {
                    depth++;
                  }
                  if (depth === 0) {
                    const end = divTagRe.lastIndex;
                    const raw = src.slice(0, end);
                    return { type: 'html', raw, text: raw, pre: false, block: true };
                  }
                }
                return false;
              },
            },
          });

        }
        marked.setOptions({
          mangle: false,
          headerIds: false,
          sanitize: false,
        });
        marked.use(extendedTables());
      };

      // Allow safe reference to previous AMD define
      var _ainiroOldDefine;

      /*
       * Checking if reCAPTCHA, Marked, and SignalR are already initialised.
       */
      if ((this.ainiro_settings.recaptcha === '-1' || typeof mcaptcha !== 'undefined' || typeof grecaptcha !== 'undefined') &&
        typeof marked !== 'undefined' &&
        typeof signalR !== 'undefined' &&
        typeof extendedTables !== 'undefined' &&
        (this.ainiro_settings.code === false || typeof hljs !== 'undefined')) {

        afterMarked();
        onAfter();

        if (_ainiroOldDefine !== undefined) {
          window.define = _ainiroOldDefine;
          _ainiroOldDefine = undefined;
        }
        return;
      }

      // Scripts we should add.
      const jsFiles = [
        'https://cdnjs.cloudflare.com/ajax/libs/marked/13.0.0/marked.min.js',
        'https://ainiro.io/assets/js/marked-tables.js',
        'https://ainiro.io/assets/js/signalr.js',
      ];
      if (this.ainiro_settings.recaptcha !== '' && this.ainiro_settings.recaptcha !== '-1') {
        jsFiles.push('https://www.google.com/recaptcha/api.js?render=' + this.ainiro_settings.recaptcha);
      } else {
        jsFiles.push(this.ainiro_settings.url + '/magic/system/misc/magic-captcha-challenge.js')
      }
      if (this.ainiro_settings.code === true) {
        jsFiles.push('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js');
      }

      // To avoid confusing any module loaders here, we reset the "define" object.
      if (window.define !== undefined) {
        _ainiroOldDefine = window.define;
        window.define = undefined;
      }
      jsFiles.forEach(idx => {
        const el = document.createElement('script');
        el.src = idx;
        document.getElementsByTagName('body')[0].appendChild(el);
      });

      const tick = () => {

        if ((this.ainiro_settings.recaptcha === '-1' || typeof mcaptcha !== 'undefined' || typeof grecaptcha !== 'undefined') &&
          typeof marked !== 'undefined' &&
          typeof signalR !== 'undefined' &&
          (this.ainiro_settings.code === false || typeof hljs !== 'undefined')) {

          afterMarked();
          onAfter();
          return;
        }
        setTimeout(tick, 250);
      };
      tick();
    },

    /*
     * Actual implementation of showing chat window, which is only invoked
     * once reCAPTCHA has been successfully included on the page.
     */
    _show: function(onAfter) {

      // Disabling button to avoid race conditions.
      const btn = this.shadow.getElementById('ainiro_send');
      btn.disabled = true;

      // Showing chat window.
      const wnd = this.shadow.getElementById('ainiro_chat_wnd');
      wnd.classList.add('show_ainiro_chatbot');

      // Making sure body element cannot scroll.
      document.body.style.height = '100vh';
      document.body.style.overflowY = 'hidden';

      // In case there we've got the stupid Shopify chat thing on page, we hide it, since it's way too greedy on z-index.
      const shopifyChatbot = document.getElementById('shopify-chat');
      if (shopifyChatbot) {
        shopifyChatbot.style.display = 'none';
      }

      // Creating socket connection unless it's already created.
      if (!this.socket) {

        // Creating our socket connection.
        this.initSocket(function() {

          // Initialising our chat surface now that our socket connection has been created.
          this.initialiseChatSurface(onAfter);

        }.bind(this));

      } else {

        // Initialising chat surface immediately since we already have a socket connection.
        this.initialiseChatSurface(onAfter);
      }
    },

    /*
     * Initialises chatbot.
     */
    initialiseChatSurface: function(onAfter) {

      // Checking if we have a greeting for the chatbot.
      if (this.initSession && this.ainiro_settings.greeting && this.ainiro_settings.greeting !== '') {

        // Adding greeting.
        const html = this.renderMarkdownWithScriptPassthrough(this.ainiro_settings.greeting);
        this.addMessage(html, 'ainiro_machine greeting', false);
      }

      if (this.execQuestionnaires) {

        // Fetching questionnaire for type from backend.
        fetch(
          this.ainiro_settings.url +
          '/magic/system/openai/questionnaire?type=' +
          encodeURIComponent(this.ainiro_settings.type))
          .then(res => {
            return res.text();
          })
          .then(res => {

            // Making sure we avoid executing questionnaire again.
            this.execQuestionnaires = false;

            // Making sure we have a questionnaire for type.
            if (!res || res === '') {

              // Adding conversation starters.
              if (this.initSession) {
                this.addConversationStarters(onAfter);
              } else if (onAfter) {
                onAfter();
              }
            } else {

              // Parsing JSON as object.
              res = JSON.parse(res);

              // Making sure we have a questionnaire for type.
              if (res.questions.length === 0) {

                // Adding conversation starters.
                if (this.initSession) {
                  this.addConversationStarters(onAfter);
                } else if (onAfter) {
                  onAfter();
                }

              } else {

                // Checking if we should run through questionnaire, and if not, returning early.
                const previous = localStorage.getItem('ainiro-questionnaire.' + res.name);
                if (previous && res.type === 'single-shot') {

                  // Trying to add conversation starters.
                  if (this.initSession) {
                    this.addConversationStarters(onAfter);
                  } else if (onAfter) {
                    onAfter();
                  }

                } else {

                  // Starting questionnaire loop.
                  this.questionnaire = {
                    questions: res,
                    current: 0,
                  };

                  // Starting questionnaire question asking process.
                  this.askQuestion(function() {
                    this.addConversationStarters(onAfter);
                  }.bind(this));
                }
              }
            }
          });

      } else if (this.initSession) {

        // Trying to add conversation starters.
        this.addConversationStarters(onAfter);

      } else if (onAfter) {

        // Invoking onafter callback.
        onAfter();
      }

      // Checking if we're supposed to scroll to the bottom.
      if (this.hasSessionItems) {

        this.scrollToBottom(false, true);

        // Making sure we do not scroll the next time chatbot it opened.
        this.hasSessionItems = false;
      }
    },

    /*
     * Creates our socket connection towards our backend.
     */
    initSocket: function(onAfter) {

      // Creating socket connection.
      this.socket = new signalR.HubConnectionBuilder()
      .withAutomaticReconnect()
      .withUrl(this.ainiro_settings.url + '/sockets', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      }).build();

      // Subscribing to messages.
      this.socket.on(this.session, (args) => {

        // Creating object from JSON.
        const obj = JSON.parse(args);

        // Checking if we're finished.
        if (obj.type) {

          switch (obj.type) {

            case 'render_html':
              this.response += '<div class="hljs_ignore">' + obj.html + '</div>';
              break;

            default:
              console.log('Unknown client-side binding; \'' + obj.type + '\'');
          }
        } else if (obj.finished === true) {

          // Checking if we've got a callback for onDone, at which point we invoke it.
          this.chatMessageDone(this.response);
          if (this.onDone) {
            this.onDone();
            this.runScriptsIn(this.shadow.getElementById('ainiro_chat_surf'));
          }
          return;
          
        } else if (obj.error === true) {

          // Checking if we've got an error.
          if (obj.error === true) {

            // Appending message to temporary response.
            const html = this.renderMarkdownWithScriptPassthrough(obj.message ?? 'An unspecified error occurred, sorry about that :/');

            // Updating value of last chat message.
            const surf = this.shadow.getElementById('ainiro_chat_surf');
            const msg = surf.childNodes[surf.childNodes.length - 1];
            msg.innerHTML = html;
            msg.className = 'ainiro_machine ainiro_error';

            // Scrolling to the bottom of surface to make sure we display currently written text.
            this.scrollToBottom(true, true);
          }
          return;

        } else if (obj.function_waiting) {

          // Waiting for function invocation.
          obj.message = '<span class="ainiro_function_waiting ainiro_function_animate"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>';

          // Resetting references to avoid showing references since server is executing AI function.
          this.references_list = [];

        } else if (obj.function_result) {

          // Function invocation succeeded.
          this.response = this.response.replace('<span class="ainiro_function_waiting"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>', '');
          this.response = this.response.replace('<span class="ainiro_function_waiting ainiro_function_animate"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>', '');
          obj.message = '<p><span class="ainiro_function_succeeded ainiro_function_animate"><i class="ainiro-icofont ainiro-icofont-star"></i>'+ obj.function_result + '</span></p>\n\n';

        } else if (obj.function_error) {

          // Function invocation failed.
          this.response = this.response.replace('<span class="ainiro_function_waiting"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>', '');
          this.response = this.response.replace('<span class="ainiro_function_waiting ainiro_function_animate"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>', '');
          obj.message = '<span class="ainiro_function_failed"><i class="ainiro-icofont ainiro-icofont-close"></i>' + obj.function_error + '</span>\n\n';

        } else if (obj.type === 'integration') {

          // Some sort of integration message.
          switch (obj.integration_type) {

            default:
              this.addMessage(obj.text, 'ainiro_machine integration ' + obj.integration_type, true);
              const surf = this.shadow.getElementById('ainiro_chat_surf');
              const html = surf.innerHTML;
              sessionStorage.setItem('ainiro_chatbot.session', html);
              this.scrollToBottom(true, true);
              break;
          }
        }

        // Verifying we've got some sort of message given.
        if (obj.message) {

          // Appending message to temporary response.
          this.response += obj.message;
  
          // Transforming Markdown
          const html = this.renderMarkdownWithScriptPassthrough(this.response);

          // Updating value of last chat message.
          const surf = this.shadow.getElementById('ainiro_chat_surf');
          const msg = surf.childNodes[surf.childNodes.length - 1];
          msg.innerHTML = html;

          // Removing animation classes.
          this.response = this.response.replace(' ainiro_function_animate', '');

          // Scrolling to the bottom of surface to make sure we display currently written text.
          this.scrollToBottom(false, false);
        }
      });

      // Starting socket connection.
      this.socket.start().then(onAfter);
    },

    /*
     * Retrieves and adds conversation starters to UI
     * if there are any conversation starters declared for chatbot.
     */
    addConversationStarters: function(onAfter) {

      // Fetching conversation starters for type from backend.
      fetch(this.ainiro_settings.url + '/magic/system/openai/conversation-starters?type=' + encodeURIComponent(this.ainiro_settings.type))
        .then(res => {
          return res.json();
        })
        .then(res => {

          // Making sure we've got questions.
          if (!res.questions || res.questions.length === 0) {
            if (onAfter) {
              onAfter();
            }

            // Making sure we don't try to add conversation starters twice.
            this.initSession = false;
            return; // Nothing to do here ...
          }

          this.addConversationElements(res.questions);
          if (onAfter) {
            onAfter();
          }

          // Making sure we don't add conversation starters twice.
          this.initSession = false;
        });
    },

    /*
     * Adds conversation elements to surface, which might be conversation starters,
     * or follow up questions.
     */
    addConversationElements(questions) {

      // Creating wrapper element for conversation starters.
      const wrp = document.createElement('div');
      wrp.className = 'ainiro_starters';
      wrp.id = 'ainiro_starter';

      // Adding button for each question.
      questions.forEach(idx => {
        const el = document.createElement('button');
        el.className = 'ainiro_starter';
        el.innerHTML = idx;
        el.setAttribute('onclick', `window.ask_follow_up(event)`);
        wrp.appendChild(el);
      });

      // Adding conversation starters to surface.
      const surf = this.shadow.getElementById('ainiro_chat_surf');
      surf.appendChild(wrp);
      this.scrollToBottom(true, false);
    },

    /*
     * Scrolls to the bottom of the chatbot surface.
     */
    scrollToBottom: function(smooth, force) {

      // Retrieving element we're supposed to scroll.
      const surf = this.shadow.getElementById('ainiro_chat_surf');

      if (force || surf.scrollTop + 50 > (surf.scrollHeight - surf.offsetHeight)) {

        if (smooth) {
          const last = surf.childNodes[surf.childNodes.length - 1];
          last.scrollIntoView({behavior: 'smooth', block: 'start'});
        } else {
          surf.scrollTop = surf.scrollHeight;
        }
      }
    },

    /*
     * Maximize or minimizes the chat window.
     */
    maximize: function() {

      // Maximizing chat window.
      const wnd = this.shadow.getElementById('ainiro_chat_wnd');
      wnd.classList.toggle('ainiro_maximized');
    },

    /*
     * Function to clear chat window and start a new session.
     */
    clear: function() {

      // Clearing out chat window and session storage.
      sessionStorage.removeItem('ainiro_chatbot.session');
      var lst = [];
      const surf = this.shadow.getElementById('ainiro_chat_surf');
      surf.childNodes.forEach(el => {
        lst.push(el);
      });
      lst.forEach(el => {
        el.parentElement.removeChild(el);
      });

      // Making sure we don't have to execute questionnaires again.
      this.execQuestionnaires = false;

      // Creating a new session and stopping existing socket connection.
      this.session = 'c_' + Date.now() + Math.random();
      this.socket?.stop();

      this.initSession = true;
      this.initSocket(function() {
        this.initialiseChatSurface();
      }.bind(this));
    },

    showSession: function() {

      // Retreiving session items for user.
      fetch(`${this.ainiro_settings.url}/magic/system/openai/history-list?user_id=` + encodeURIComponent(this.userId))
        .then(res => {
          if (res.status >= 200 && res.status <= 299) {
            return res.text(); // read raw text first
          } else {
            throw res;
          }
        })
        .then(text => {
          if (text.trim().length === 0) {
            return [];
          }
          return JSON.parse(text);
        })
        .then(res => {
          this._showSession(res);
        })
        .catch(err => {
          console.error("Fetch error:", err);
        });
    },

    _showSession: function(items) {

      // Checking if dropdown already exists, at which point we delete it.
      const existing = this.shadow.querySelector('.ainiro_sessions_list');
      if (existing) {
        existing.parentNode.removeChild(existing);
        return;
      }

      // Making sure we've got items at all.
      if (items.length === 0) {
        return;
      }

      // Figuring out height of toolbar.
      const toolbar = this.shadow.querySelector('.ainiro_toolbar');
      const topPosition = toolbar.clientHeight + 5;

      // Finding parent element to inject popup into.
      const parentEl = this.shadow;

      // Creating our popup div.
      const sessionEl = document.createElement('div');
      sessionEl.className = 'ainiro_sessions_list';
      sessionEl.style.top = topPosition + 'px';

      // Creating our unordered list.
      const ul = document.createElement('ul');
      sessionEl.appendChild(ul);

      // Adding each session item into popup.
      for (let idx = 0; idx < items.length; idx++) {
        const cur = document.createElement('li');
        const link =  document.createElement('a');
        link.href = '#';
        link.innerHTML = items[idx].name;
        link.addEventListener('click', (ev) => this.selectSession(ev, items[idx].session_id));
        cur.appendChild(link);
        ul.appendChild(cur);
      }

      // Adding popup into parent.
      parentEl.appendChild(sessionEl);
    },

    selectSession: function(event, session) {

      event.stopPropagation();
      event.preventDefault()

      // Making sure we destroy drop down ...
      const existing = this.shadow.querySelector('.ainiro_sessions_list');
      if (existing) {
        existing.parentNode.removeChild(existing);
      }

      // Fetching session and making it our current session.
      fetch(`${this.ainiro_settings.url}/magic/system/openai/active-session`, {
        method: 'POST',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({
          session_id: session
        })
        })
        .then(res => {
          if (res.status >= 200 && res.status <= 299) {
            return res.json();
          } else {
            throw res;
          }
        })
        .then((res) => {

          // Updating GUI ...
          const surface = this.shadow.getElementById('ainiro_chat_surf');

          // Deleting old items.
          const toDel = [];
          for (let idx = 0; idx < surface.childNodes.length; idx++) {
            switch (surface.childNodes[idx].className) {
              case 'ainiro_human':
              case 'ainiro_machine':
              case 'ainiro_starters':
                toDel.push(surface.childNodes[idx]);
                break;
            }
          }
          for (let idx = 0; idx < toDel.length; idx++) {
            toDel[idx].parentNode.removeChild(toDel[idx]);
          }

          // Adding new items.
          for (let idx = 0; idx < res.length; idx++) {
            switch (res[idx].role) {

              case 'user':
                this.addMessage(res[idx].content, 'ainiro_human');
                break;

              case 'assistant':
                this.addMessage('', 'ainiro_machine');
                this.chatMessageDone(res[idx].content, idx === res.length - 1);
                break;
            }
          }

          // Scrolling to bottom.
          this.scrollToBottom(true, true);

          // Updating session, which needs to recreate the socket connection.
          this.session = session;
          this.socket?.stop();
          this.initSocket(null);
        });
    },

    /*
     * Hides the chat window.
     */
    hide: function() {

      // Shows chat button.
      const btn = this.shadow.getElementById('ainiro_chat_btn');
      btn.classList.remove('ainiro_hide');

      // Hides chat window.
      const wnd = this.shadow.getElementById('ainiro_chat_wnd');
      wnd.classList.remove('show_ainiro_chatbot');

      // Making sure body element cannot scroll.
      document.body.style.height = '';
      document.body.style.overflowY = '';

      // Showing Shopify chat again (if it exists on page).
      const shopifyChatbot = document.getElementById('shopify-chat');
      if (shopifyChatbot) {
        shopifyChatbot.style.display = 'block';
      }
      sessionStorage.setItem('ainiro_state', 'closed');
    },

    /*
     * Adds the specified message with the specified CSS class, and optionally
     * creates an animation to animate element into view.
     */
    addMessage: function(msg, cls, animate = true) {

      // Creating message wrapper.
      const el = document.createElement('div');
      el.innerHTML = msg;
      if (animate) {
        cls += ' ainiro_just_added';
        setTimeout(() => {
          el.classList.remove('ainiro_just_added');
        }, 1000);
      }
      el.className = cls;

      // Checking if we've got "ainiro_starter" element, at which point we insert the message *BEFORE* these.
      const starters = this.shadow.getElementById('ainiro_starter');
      if (starters) {

        // Appending message to surface container.
        const surf = this.shadow.getElementById('ainiro_chat_surf');
        surf.insertBefore(el, starters);

      } else {

        // Appending message to surface container.
        const surf = this.shadow.getElementById('ainiro_chat_surf');
        surf.appendChild(el);
      }
    },

    /*
     * Invoked when form is submitted.
     */
    submit: function() {

      // Making sure user provided any actual text.
      const txtEl = this.shadow.getElementById('ainiro_txt');
      if (txtEl.value.trim() === '') {
        return;
      }

      // Disabling send button.
      const btn = this.shadow.getElementById('ainiro_send');
      btn.disabled = true;

      // Making sure we remove conversation starters if they're in the DOM.
      const wrp = Array.from(this.shadow.querySelectorAll('.ainiro_starters'));
      if (wrp) {
        for (let idx = 0; idx < wrp.length; idx++) {
          wrp[idx].parentNode.removeChild(wrp[idx]);
        }
      }

      // Removing text of upload file button.
      const lbl = this.shadow.getElementById('ainiro_filename_label');
      if (lbl) {
        lbl.innerHTML = '';
      }

      // Adding query to surface.
      this.addMessage(txtEl.value, 'ainiro_human');

      // Common function to invoke once CAPTCHA has been resolved.
      const functor = (token) => {

        // Checking if we're in "questionnaire mode".
        if (this.questionnaire) {

          // Submitting questionnaire answer.
          this.submitAnswer(token);
      
        } else {

          // Submitting question to chatbot.
          this.submitQuestion(token);
        }
      };
    
      // Checking if we've got a reCAPTCHA site key.
      if (this.ainiro_settings.recaptcha && this.ainiro_settings.recaptcha !== '' && this.ainiro_settings.recaptcha !== '-1') {

        // We have a reCAPTCHA site-key.
        grecaptcha.ready(function() {
          grecaptcha.execute(this.ainiro_settings.recaptcha, {action: 'submit'}).then(function(token) {
            functor(token)
          }.bind(this));
        }.bind(this));

      } else if (this.ainiro_settings.recaptcha !== '-1') {

        // No reCAPTCHA site-key is specified for type, using Magic CAPTCHA.
        mcaptcha.token(function (token) {
          functor(token);
        }.bind(this), 3);
        
      } else {

        // No CAPTCHA what so ever is being used.
        functor();
      }
    },

    /*
     * Submits answer to questionnaire question to backend.
     */
    submitAnswer: function(token) {

      // Retrieving query input field and sanity checking input.
      const txtEl = this.shadow.getElementById('ainiro_txt');
      if (txtEl.value.trim() === '') {
        return;
      }

      // Disabling send button.
      const btn = this.shadow.getElementById('ainiro_send');
      btn.disabled = true;

      // Creating our payload.
      const payload = {
        type: window.getAiniroChatbotType ? window.getAiniroChatbotType() ?? this.ainiro_settings.type : this.ainiro_settings.type,
        session: this.session,
        user_id: this.userId,
        question: this.questionnaire.questions.questions[this.questionnaire.current].question,
        answer: txtEl.value,
        context: this.questionnaire.questions.questions[this.questionnaire.current].context,
        session: this.session,
      };
      if (token) {
        payload.recaptcha_response = token;
      }

      // Invoking backend, with reCAPTCHA response if we've got a site-key.
      fetch(`${this.ainiro_settings.url}/magic/system/openai/answer`, {
        method: 'POST',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(res => {
        if (res.status >= 200 && res.status <= 299) {
          return res.json();
        } else {
          throw res;
        }
      }).then(() => {

        // Retrieving query input field and resetting its prompt.
        const txtbox = this.shadow.getElementById('ainiro_txt');
        txtbox.value = '';

        // Storing user's answer.
        this.questionnaire.questions.questions[this.questionnaire.current].answer = txtEl.value;

        // Checking if we've got a callback for onDone, at which point we invoke it.
        if (this.onDone) {
          this.onDone();
        }

        // Making sure we enable form fields.
        this.onFinished();

        // Incrementing current question index.
        this.questionnaire.current += 1;

        // Checking if we've got more questions, and if not, storing questionnaire, and returning early.
        if (this.questionnaire.current >= this.questionnaire.questions.questions.length) {

          // Finalizing questionnaire.
          this.onQuestionnaireDone();
          return;
        }

        // Asking next question.
        this.askQuestion();

      }).catch(err => {

        // Oops, error.
        err.json().then(errObj => {

          // Appending message to temporary response.
          const html = this.renderMarkdownWithScriptPassthrough(errObj.message);

          // Updating value of last chat message.
          const surf = this.shadow.getElementById('ainiro_chat_surf');
          const msg = surf.childNodes[surf.childNodes.length - 1];
          msg.innerHTML = html;
          msg.className = 'ainiro_machine ainiro_error';

          // Scrolling to the bottom of surface to make sure we display currently written text.
          this.scrollToBottom(true, true);

          // Checking if we've got a callback for onDone, at which point we invoke it.
          if (this.onDone) {
            this.onDone();
          }

          // Making sure we enable form fields.
          this.onFinished();
        });
      });
    },

    /*
     * Invoked when questionnaire has been done and needs to be finalized.
     *
     * Might include invoking server-side action declared for questionnaire.
     */
    onQuestionnaireDone: function() {

      // Checking if we've got an action associated with questionnaire.
      if (this.questionnaire.questions.action && this.questionnaire.questions.action !== '') {

        // Invoking action on server.
        const payload = {
          action: this.questionnaire.questions.action,
          values: {},
        };
        this.questionnaire.questions.questions.forEach(idx => {
          if (idx.name && idx.name !== '') {
            payload.values[idx.name] = idx.answer;
          }
        });
        fetch(`${this.ainiro_settings.url}/magic/system/openai/questionnaire-action`, {
          method: 'POST',
          headers: {
            "Content-Type": 'application/json'
          },
          body: JSON.stringify(payload)
        }).then(res => {
          if (res.status >= 200 && res.status <= 299) {
            return res.json();
          } else {
            throw Error(res.statusText);
          }
        }).then(() => {

          // Adding conversation starters if there are any.
          if (this.initSession) {
            this.addConversationStarters();
          }
        });

      } else {

        // Adding conversation starters if there are any.
        if (this.initSession) {
          this.addConversationStarters();
        }
      }

      // Checking if this is single-shot action at which point we store the fact that we've taken questionnaire in localStorage.
      if (this.questionnaire.questions.type === 'single-shot') {

        // Storing the fact that we've taken questionnaire in localStorage.
        localStorage.setItem(
          'ainiro-questionnaire.' + this.questionnaire.questions.name,
          'true');
      }

      // Setting questionnaire to null makes sure LLM takes over.
      this.questionnaire = null;
    },

    /*
     * Asks the user a single question from the chatbot's questionnaire.
     */
    askQuestion: function() {

      // Adds the current questionnaire message as a machine / question.
      this.addMessage(this.questionnaire.questions.questions[this.questionnaire.current].question, 'ainiro_machine ainiro_question');

      // Making sure last message is scrolled into view.
      this.scrollToBottom(true, true);

      // Waiting for 800 milliseconds before we check if we should show next questionnaire item.
      setTimeout(() => {

        /*
         * Removing animation CSS class from question.
         */
        const surf = this.shadow.getElementById('ainiro_chat_surf');
        surf.childNodes[surf.childNodes.length - 1].classList.remove('ainiro_question');

        // Checking if currently asked question was in fact a message, at which point we ask the next question.
        if (this.questionnaire.questions.questions[this.questionnaire.current].type === 'message') {

          // Incrementing questionnaire index.
          this.questionnaire.current += 1;

          // Checking if we've got more questions, and if not, storing questionnaire, and returning early.
          if (this.questionnaire.current >= this.questionnaire.questions.questions.length) {

            // Finalizing questionnaire.
            this.onQuestionnaireDone();

            // Enabling send button.
            const btn = this.shadow.getElementById('ainiro_send');
            btn.disabled = false;

            return;
          }

          // Removing animation class for last chatbot question.
          this.askQuestion();

          // Scrolling to bottom to make sure user sees the question.
          this.scrollToBottom(true, true);

        } else {

          // Enabling send button.
          const btn = this.shadow.getElementById('ainiro_send');
          btn.disabled = false;
        }

      }, 800);
    },

    /*
     * Submits question to chatbot.
     */
    submitQuestion: function(token) {

      // Retrieving query input field and disabling it.
      const txtEl = this.shadow.getElementById('ainiro_txt');
      if (txtEl.value.trim() === '') {
        return;
      }

      // Disabling send button.
      const btn = this.shadow.getElementById('ainiro_send');
      btn.disabled = true;

      // Adding wait message to surface.
      this.addMessage('<p><span class="ainiro-dot ainiro-dot-1" style="background-color: ' + this.ainiro_settings.color + '"></span><span class="ainiro-dot ainiro-dot-2" style="background-color: ' + this.ainiro_settings.color + '"></span><span class="ainiro-dot ainiro-dot-3" style="background-color: ' + this.ainiro_settings.color + '"></span></p>', 'ainiro_machine');
      this.scrollToBottom(true, true);

      // Resetting response.
      this.response = '';

      // Building our URL.
      let type = this.ainiro_settings.type;
      if (window.getAiniroChatbotType) {
        type = window.getAiniroChatbotType() ?? type;
      }
      let url = this.ainiro_settings.url + `/magic/system/openai/chat`;
      let payload = {
        prompt: txtEl.value,
        type: type,
        session: this.session,
        user_id: this.userId,
        chat: true,
        stream: true,
        referrer: window.location.href,
        extra: this.ainiro_settings.extra,
        permanent: this.ainiro_settings.history
      };
      if (token) {
        payload.recaptcha_response = token;
      }
      if (this.ainiro_settings.meta && this.ainiro_settings.meta !== '') {
        payload.meta = this.ainiro_settings.meta;
      }
      if (this.ainiro_settings.references) {
        payload.references = true;
      }
      const formData  = new FormData();
      for(const name in payload) {
        formData.append(name, payload[name]);
      }
      for (let idx = 0; idx < (this.rawFiles || []).length; idx++) {
        formData.append('file', this.rawFiles[idx]);
      }

      // Resetting onDone.
      this.onDone = null;

      // Resetting references.
      this.references_list = [];

      // Invoking backend.
      fetch(url, {
        method: 'POST',
        body: formData
      }).then(res => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      }).then(res => {

        // If server returns a cached answer, result will contain the response.
        if (res.result) {

          // Invoking function responsible for wrapping up a chat response.
          this.chatMessageDone(res.result);

        } else {

          // Storing references.
          this.references_list = res.references ?? [];

          // Server is not returning cached answer, and therefor we must store references, and make sure we adds these afterwards.
          this.onDone = () => {

            // Adding references.
            if (this.references_list.length > 0) {
              this.addReferences(this.references_list);
            }
          };
        }

        // Retrieving query input field and resetting its prompt.
        const txtbox = this.shadow.getElementById('ainiro_txt');
        txtbox.value = '';
        const fileInp = this.shadow.getElementById('ainiro_upload');
        if (fileInp) {
          fileInp.value = null;
        }
        this.rawFiles = null;

      }).catch(err => {

        // Oops, error.
        err.json().then(errObj => {

          // Appending message to temporary response.
          const html = this.renderMarkdownWithScriptPassthrough(errObj.message);

          // Updating value of last chat message.
          const surf = this.shadow.getElementById('ainiro_chat_surf');
          const msg = surf.childNodes[surf.childNodes.length - 1];
          msg.innerHTML = html;
          msg.className = 'ainiro_machine ainiro_error';

          // Making sure we enable form fields.
          this.onFinished();

          // Scrolling to the bottom of surface to make sure we display currently written text.
          this.scrollToBottom(true, true);
        });
      });
    },

    /*
     * Invoked when a chat message is completed by server.
     */
    chatMessageDone: function(response, addConvoFollowUps = true) {

      // Defaulting Markdown to be transformed to entire result from server.
      let wholeMarkdown = response;

      // Buffer for follow up questions. This will be empty if we don't have follow up questions.
      let followUpQuestions = [];

      const markdownSections = wholeMarkdown.split('\n---');
      if (this.ainiro_settings.follow_up && markdownSections.length > 1) {
        followUpQuestions = markdownSections.pop();
        wholeMarkdown = markdownSections.join('\n---').trim();
      }
      const html = this.renderMarkdownWithScriptPassthrough(wholeMarkdown);

      // Updating value of last chat message.
      const surf = this.shadow.getElementById('ainiro_chat_surf');
      const msg = surf.childNodes[surf.childNodes.length - 1];
      msg.innerHTML = html;

      // Checking if we've got code syntax highlighting turned on.
      if (this.ainiro_settings.code === true) {

        // Finding all PRE elements.
        for (let idx = 0; idx < msg.childNodes.length; idx++) {

          if (msg.childNodes[idx].tagName === 'PRE') {
            hljs.highlightElement(msg.childNodes[idx]);
            msg.childNodes[idx].innerHTML = msg.childNodes[idx].innerHTML + '<button class="copy_code_button" onclick="ainiro.copyCode(event)"><i class="ainiro-icofont ainiro-icofont-copy"></i></button>';
          }
        }
      }

      // Adding references immediately.
      this.addReferences(this.references);

      // Checking if we've got follow up questions.
      if (followUpQuestions.length > 0 && addConvoFollowUps) {

        const followUp = [];
        const htmlFU = this.renderMarkdownWithScriptPassthrough(followUpQuestions);
        const domRoot = document.createElement('div');
        domRoot.innerHTML = htmlFU;

        const listItems = domRoot.childNodes;
        for (let idxNo = 0; idxNo < listItems.length; idxNo++) {
          if (listItems[idxNo].tagName == 'UL' || listItems[idxNo].tagName === 'OL') {
            for (let idxChildNo = 0; idxChildNo < listItems[idxNo].childNodes.length; idxChildNo ++) {
              if (listItems[idxNo].childNodes[idxChildNo].tagName === 'LI') {
                followUp.push(listItems[idxNo].childNodes[idxChildNo].innerText);
              }
            }
          }
        }
        this.addConversationElements(followUp);
      }

      // Making sure we enable form fields.
      this.onFinished();

      // Scrolling to the bottom of surface to make sure we display currently written text.
      this.scrollToBottom(false, false);
    },

    extractScripts: function(src) {

      const scripts = [];
      const TOKEN = `%%RAW_SCRIPT_${Math.random().toString(36).slice(2)}%%`;
      let i = 0, out = '', pos = 0;

      const findNextFence = (s, from) => {
        const openRe = /(^|\r?\n)[ \t]*(?:>[ \t]*)*(?:(?:\d+[.)]|[*\-+])[ \t]+)?([`~]{3,})([^\r\n]*)(?:\r?\n|$)/g;
        const slice = s.slice(from);
        const m = openRe.exec(slice);
        if (!m) return null;

        const marks = m[2], fChar = marks[0], fLen = marks.length;
        const openAbsStart = from + m.index + (m[1] ? m[1].length : 0);
        const afterOpen    = from + m.index + m[0].length;
        const fenceCharEsc = fChar === '`' ? '\\`' : '~';
        const closeRe = new RegExp('(^|\\r?\\n)[ \\t]*(?:>[ \\t]*)*' + fenceCharEsc + '{' + fLen + ',}\\s*(?=\\r?\\n|$)', 'g');

        const slice2 = s.slice(afterOpen);
        const m2 = closeRe.exec(slice2);
        const endAbs = m2 ? (afterOpen + m2.index + m2[0].length) : s.length;
        return { start: openAbsStart, end: endAbs };
      };

      const findNextScript = (s, from) => {
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

        if (!fence && !scr) { out += src.slice(pos); break; }

        if (fence && (!scr || fence.start <= scr.start)) {
          out += src.slice(pos, fence.end);
          pos = fence.end;
          continue;
        }

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
    },

    restoreScripts: function(html, scripts) {

      let out = html;
      for (const s of scripts) out = out.split(s.key).join(s.html);
      return out;
    },

    renderMarkdownWithScriptPassthrough: function (md) {

      const parts = this.extractScripts(md);
      const rendered = marked.parse(parts.without);
      return this.restoreScripts(rendered, parts.scripts);
    },

    /*
     * Invoked when user wants to copy code.
     */
    copyCode: function(e) {
      let src = e.target || e.srcElement;
      if (src.tagName === 'I') {
        src = src.parentElement;
      }
      const msg = src.parentElement.innerText;
      navigator.clipboard.writeText(msg).then(() => {
        console.log('Code copied to clipboard');
      });
    },

    /*
     * Invoked when references are supposed to be added to the output response element.
     */
    addReferences: function(references) {

      // Verifying we actually have references.
      if (!references || references.length === 0) {
        return;
      }

      // Creating bulleted list to contain references.
      const ul = document.createElement('ul');
      ul.className = 'ainiro_references';

      // Looping through each reference and adding it as a DOM element to result element.
      references.forEach(idx => {

        // Creating list item and hyperlink.
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = idx.uri;
        a.innerText = idx.prompt;
        if (this.ainiro_settings.new_tab) {
          a.target = '_blank';
        }
        li.appendChild(a);

        // Adding list item (with hyperlink) to ul element.
        ul.appendChild(li);
      });

      // Adding ul element to surface.
      const surf = this.shadow.getElementById('ainiro_chat_surf');
      let last = surf.childNodes[surf.childNodes.length - 1];
      if (last.classList.contains('ainiro_starters')) {
        last  = surf.childNodes[surf.childNodes.length - 2];
      }
      last.appendChild(ul);

      // Storing HTML for surface area into session.
      const html = surf.innerHTML;
      sessionStorage.setItem('ainiro_chatbot.session', html);
    },

    /*
     * Invoked when server is finished streaming response from OpenAI.
     *
     * Enables textbox input field and submit button, and rmoves prompt and sets focus to input field.
     */
    onFinished: function() {

      // Enabling send button.
      const btn = this.shadow.getElementById('ainiro_send');
      btn.disabled = false;

      // Retrieving surface for chat messages.
      const surf = this.shadow.getElementById('ainiro_chat_surf');

      // Adding "copy response button", if we should.
      if (this.ainiro_settings.copyButton) {

        // Chatbot is configured to have a "copy response" button.
        let lastMsg = surf.childNodes[surf.childNodes.length - 1];
        if (lastMsg.classList.contains('ainiro_starters')) {
          lastMsg = surf.childNodes[surf.childNodes.length - 2];
        }
        if (lastMsg.classList.contains('ainiro_machine')) {
          lastMsg.innerHTML = `<button class='ainiro_copy_response' onclick='ainiro.copyAnswer(event);'><i class="ainiro-icofont ainiro-icofont-copy"></i></button>` + lastMsg.innerHTML;
        }
      }

      // Storing chat messages in local storage.
      const html = surf.innerHTML;
      sessionStorage.setItem('ainiro_chatbot.session', html);
    },

    /*
     * Invoked when user wants to copy the response from the AI.
     */
    copyAnswer: function(e) {

      let src = e.target || e.srcElement;
      if (src.tagName === 'I') {
        src = src.parentElement;
      }
      const msg = src.parentElement.innerText;
      navigator.clipboard.writeText(msg).then(() => {
        console.log('Answer copied to clipboard');
      });
    },

    /*
     * Opens the chatbot from an external button.
     *
     * This might be an FAQ button, or an external button, somehow triggering the AI chatbot.
     */
    ask: function(e, msg = null) {

      // Retrieving message user wants to ask, if any, prioritising explicit message passed into function.
      const question = msg ?? e.srcElement.innerText;

      // Checking if we should show questionnaires.
      if (question && question !== '') {

        /*
         * Since the user asks an FAQ question, we prevent questionnaires from being shown,
         * to allow question to being answered immediately, without forcing the user through
         * a quesitonnaire first.
         */
        this.execQuestionnaires = false;
      }

      // Opening chat window, and ensuring we submit form once the chat window is visible.
      this.show(() => {

        // Setting query
        const query = this.shadow.getElementById('ainiro_txt');
        query.value = question;

        if (question && question !== '') {
          this.submit();
        }
      });
    },

    runScriptsIn: async function (root) {

      const scripts = Array.from(root.querySelectorAll('.hljs_ignore script:not([data-executed])'));

      for (const oldScript of scripts) {
        oldScript.setAttribute('data-executed', '1');

        const parent = oldScript.parentNode;
        if (!parent) {
          continue;
        }
        const newScript = document.createElement('script');
        for (const { name, value } of Array.from(oldScript.attributes)) {
          if (name !== 'data-executed') {
            newScript.setAttribute(name, value);
          }
        }

        const isExternal = !!oldScript.src;
        if (!isExternal) {
          newScript.textContent = oldScript.textContent || '';
        }

        const wait = isExternal
          ? new Promise(function (resolve) {
              newScript.addEventListener('load', function () { resolve(); }, { once: true });
              newScript.addEventListener('error', function (ev) {
                console.error('External classic script failed to load:', newScript.src, ev);
                resolve();
              }, { once: true });
            })
          : Promise.resolve();

        try {
          parent.replaceChild(newScript, oldScript);
          await wait;
        } catch (e) {
          console.error('Inline classic script threw while executing:', e, newScript);
        }
      }
    }
  };

  // Initializing chatbot.
  ainiro.init();

  // Making sure we're backwards compatible with FAQ invocations.
  window.ainiro_faq_question = window.ainiro.ask.bind(window.ainiro);

  // Internal function to ask follow up question.
  window.ask_follow_up = function(e) {

    // Changing value of textbox.
    const query = window.ainiro.shadow.getElementById('ainiro_txt');
    const question = e.srcElement.innerText;
    query.value = question;

    // Submitting form to retrieve answer to question.
    window.ainiro.submit();
  }

})();
