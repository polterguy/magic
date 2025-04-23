
/*
 * Modern JavaScript file for OpenAI chat inclusion.
 */
(function() {

  // Avoiding double inclusion issues.
  if (window.ainiro) {
    return;
  }

  // Creating our primary namespace.
  window.ainiro = {

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
      hidden: [[hidden]]
    },

    // References buffer for storing references during invocation.
    references_list: [],

    /*
     * SignalR socket connection to backend.
     */
    socketConnection: null,

    /*
     * If true, we need to initialize session by running through questionnaires.
     */
    execQuestionnaires: true,

    /*
     * If true, we need to initialise session with greeting, and conversation starters.
     */
    initSession: true,

    /*
     * Channel used for communication, and session ID.
     */
    sessionId: null,

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

      // Adding our CSS selector to body HTML element to make it easier to create targeted CSS selectors.
      document.body.classList.add('ainiro_bdy');

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
       */
      const cssFileElement = document.createElement('link');
      let styleUrl = `${this.ainiro_settings.url}/magic/system/openai/include-style.css?`;
      styleUrl += `file=${encodeURIComponent(theme)}&`;
      styleUrl += `position=${encodeURIComponent(this.ainiro_settings.position)}&`;
      styleUrl += `color=${encodeURIComponent(this.ainiro_settings.color)}&`;
      styleUrl += `link=${encodeURIComponent(this.ainiro_settings.link)}&`;
      styleUrl += `start=${encodeURIComponent(this.ainiro_settings.start)}&`;
      styleUrl += `end=${encodeURIComponent(this.ainiro_settings.end)}&`;
      styleUrl += `v=${encodeURIComponent(this.ainiro_settings.version)}`;
      cssFileElement.href = styleUrl;
      cssFileElement.rel = 'stylesheet';
      const head = document.getElementsByTagName('head')[0];
      head.appendChild(cssFileElement);

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

      // Appending button to document.
      document.getElementsByTagName('body')[0].appendChild(chatButton);

      /*
       * Creating chatbot window.
       *
       * Notice, chat window is always on page, it's just invisible when the chatbot is not used.
       * This makes it faster to initialise and results in better UX.
       */
      const chatWindow = document.createElement('div');
      chatWindow.className = 'ainiro ainiro_' + this.ainiro_settings.position;
      chatWindow.id = 'ainiro_chat_wnd';
      chatWindow.style.display = 'none';
      if (this.ainiro_settings.rtl) {
        chatWindow.style.direction = 'rtl';
      }
      window.document.getElementsByTagName('body')[0].appendChild(chatWindow);

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

      // Creating chatbot form including input textbox and submit button.
      const chatForm = document.createElement('form');
      chatForm.id = 'ainiro_form';
      chatForm.className = 'ainiro_form';
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
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

      // Submit prompt button.
      const submitButton = document.createElement('button');
      submitButton.id = 'ainiro_send';
      submitButton.className = 'ainiro_send';
      submitButton.type = 'submit';
      submitButton.innerHTML = '<i class="ainiro-icofont-location-arrow ainiro-icofont-lg"></i>';
      chatForm.appendChild(submitButton);
      chatWindow.appendChild(chatForm);

      /*
       * Checking if we've got something in our session storage,
       * implying the user has already asked the chatbot something, possibly on a previous page or something.
       *
       * This allows us to continue the chat session as the user is browsing the website, visiting links, etc,
       * while avoiding running through the same questionnaire multiple times in the same session, and also
       * keeping the context for questions asked previously.
       */
      const sessionItems = sessionStorage.getItem('ainiro_chatbot.session');
      if (sessionItems && sessionItems !== '') {

        // We've got an existing session and user have already asked at least one question.
        chatSurface.innerHTML = sessionItems;

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
    },

    /*
     * Deletes DOM elements associated with chatbot, and cleans up DOM
     */
    destroy: function() {
      document.body.classList.remove('ainiro_bdy');
      const wnd = document.getElementById('ainiro_chat_wnd');
      wnd.parentElement.removeChild(wnd);
      const btn = document.getElementById('ainiro_chat_btn');
      btn.parentElement.removeChild(btn);
    },

    /*
     * Shows the chat window.
     *
     * Notice, this does a little bit of JavaScript trickery to make sure CAPTCHA JS, Marked JS, and SignalR JS
     * have been included before the window is shown.
     */
    show: function(onAfter = null) {

      // Hiding chat button.
      const btn = document.getElementById('ainiro_chat_btn');
      btn.classList.add('ainiro_hide');
      btn.classList.add('ainiro_shown');

      /*
       * Including resources with callback function being the actual show function, ensuring that chatbot
       * is not shown before resources have been included on page.
       */
      this.includeResources(() => {

        // Now we can safely invoke our real show function.
        this._show(onAfter);
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
          });
        }
        marked.use(extendedTables());
      };

      /*
       * Checking if reCAPTCHA, Marked, and SignalR are already initialised, and invoking
       * callback and returning early if they are already included.
       */
      if ((this.ainiro_settings.recaptcha === '-1' || typeof mcaptcha !== 'undefined' || typeof grecaptcha !== 'undefined') &&
        typeof marked !== 'undefined' &&
        typeof signalR !== 'undefined' &&
        typeof extendedTables !== 'undefined' &&
        (this.ainiro_settings.code === false || typeof hljs !== 'undefined')) {

        // Invokingh callback and returning since everything is already included on page.
        afterMarked();
        onAfter();
        return;
      }

      // Scripts we should add.
      const jsFiles = [
        'https://cdn.jsdelivr.net/npm/marked@13.0.0/marked.min.js',
        'https://ainiro.io/assets/js/marked-tables.js',
        'https://ainiro.io/assets/js/signalr.js',
      ];
      if (this.ainiro_settings.recaptcha !== '' && this.ainiro_settings.recaptcha !== '-1') {
        jsFiles.push('https://www.google.com/recaptcha/api.js?render=' + this.ainiro_settings.recaptcha);
      } else {
        jsFiles.push(this.ainiro_settings.url + '/magic/system/misc/magic-captcha-challenge.js')
      }
      if (this.ainiro_settings.code === true) {

        // Adding JavaScript file.
        jsFiles.push('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js');
      }
      jsFiles.forEach(idx => {

        // Appending JS file to body element.
        const el = document.createElement('script');
        el.src = idx;
        document.getElementsByTagName('body')[0].appendChild(el);
      });

      /*
       * Postponing execution of callback until reCAPTCHA, Marked, and SignalR have been initialised.
       *
       * This little trickery ensures we do not continue initialization of chatbot before all required
       * JavaScript files have been included and are executed, which prevents rendering issues, in addition
       * to issues relating from reCAPTCHA not being initialized.
       */
      const tick = () => {

        // Checking if all JS resources have been downloaded and initialised.
        if ((this.ainiro_settings.recaptcha === '-1' || typeof mcaptcha !== 'undefined' || typeof grecaptcha !== 'undefined') &&
          typeof marked !== 'undefined' &&
          typeof signalR !== 'undefined' &&
          (this.ainiro_settings.code === false || typeof hljs !== 'undefined')) {

          // Invoking callback and returning early to avoid recursively invoking self again.
          afterMarked();
          onAfter();
          return;
        }

        // Invoking self again to check in 250ms if resources have been included correctly.
        setTimeout(tick, 250);
      };
      tick();
    },

    /*
     * Actual implementation of showing chat window, which is only invoked
     * once reCAPTCHA has been successfully included on the page.
     */
    _show: function(onAfter) {

      // Showing chat window.
      const wnd = document.getElementById('ainiro_chat_wnd');
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
        const html = marked.parse(this.ainiro_settings.greeting);
        this.addMessage(html, 'ainiro_machine greeting', false);
      }

      /*
       * Checking if we should intialize chatbot with questionnaires before allowing user to access LLM.
       *
       * Notice, if user has already opened the chatbot before and asked a question, we do not execute this part.
       * 
       * Also if user asks an FAQ question we also do not invoke this part to avoid having the initial questionnaire
       * and conversation starters interfere with the FAQ question.
       */
      if (this.execQuestionnaires) {

        /*
         * We should initialise chatbot with initial questionnaires and
         * conversation starters.
         * 
         * First we disable send button while we're initializing chatbot.
         */
        const btn = document.getElementById('ainiro_send');
        btn.disabled = true;

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

              // Enabling button again.
              btn.disabled = false;

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

                // No questionnaire for type.
                btn.disabled = false;

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

                  // Single-shot questionnaire and user has already answered it, no questionnaire.
                  btn.disabled = false;

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
        if (obj.finished === true) {

          // Checking if we've got a callback for onDone, at which point we invoke it.
          this.chatMessageDone(this.response);
          if (this.onDone) {
            this.onDone();
          }
          return;
          
        } else if (obj.error === true) {

          // Checking if we've got an error.
          if (obj.error === true) {

            // Appending message to temporary response.
            const html = marked.parse(obj.message ?? 'An unspecified error occurred, sorry about that :/');

            // Updating value of last chat message.
            const surf = document.getElementById('ainiro_chat_surf');
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
          obj.message = '<span class="ainiro_function_succeeded ainiro_function_animate"><i class="ainiro-icofont ainiro-icofont-star"></i>'+ obj.function_result + '</span>\n\n';

        } else if (obj.function_error) {

          // Function invocation failed.
          this.response = this.response.replace('<span class="ainiro_function_waiting"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>', '');
          this.response = this.response.replace('<span class="ainiro_function_waiting ainiro_function_animate"><i class="ainiro-icofont ainiro-icofont-web"></i>Waiting ...</span>', '');
          obj.message = '<span class="ainiro_function_failed"><i class="ainiro-icofont ainiro-icofont-close"></i>' + obj.function_error + '</span>\n\n';

        }

        // Verifying we've got some sort of message given.
        if (obj.message) {

          // Appending message to temporary response.
          this.response += obj.message;
  
            // Transforming Markdown
          const html = marked.parse(this.response);

          // Updating value of last chat message.
          const surf = document.getElementById('ainiro_chat_surf');
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

        // Creating button for conversation starter.
        const el = document.createElement('button');
        el.className = 'ainiro_starter';
        el.innerHTML = idx;
        el.setAttribute('onclick', `window.ask_follow_up(event)`);
        wrp.appendChild(el);
      });

      // Adding conversation starters to surface.
      const surf = document.getElementById('ainiro_chat_surf');
      surf.appendChild(wrp);
      this.scrollToBottom(true, false);
    },

    /*
     * Scrolls to the bottom of the chatbot surface.
     */
    scrollToBottom: function(smooth, force) {

      // Retrieving element we're supposed to scroll.
      const surf = document.getElementById('ainiro_chat_surf');

      /*
       * If we're not forcing scrolling, and we've scrolled up at least 50px,
       * we do not scroll chat window, to allow user to explicitly scroll up to "lock scrolling",
       * allowing user to read content before it's finished without being disturbed by
       * automatic scrolling.
       */
      if (force || surf.scrollTop + 50 > (surf.scrollHeight - surf.offsetHeight)) {

        // Checking if we should scroll smooth.
        if (smooth) {

          // Smooth scrolling.
          const last = surf.childNodes[surf.childNodes.length - 1];
          last.scrollIntoView({behavior: 'smooth', block: 'start'});

        } else {

          // Instant scrolling.
          const surf = document.getElementById('ainiro_chat_surf');
          surf.scrollTop = surf.scrollHeight;
        }
      }
    },

    /*
     * Maximize or minimizes the chat window.
     */
    maximize: function() {

      // Maximizing chat window.
      const wnd = document.getElementById('ainiro_chat_wnd');
      wnd.classList.toggle('ainiro_maximized');
    },

    /*
     * Function to clear chat window.
     */
    clear: function() {

      // Clearing out chat window and session storage.
      sessionStorage.removeItem('ainiro_chatbot.session');
      var lst = [];
      const surf = document.getElementById('ainiro_chat_surf');
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

      /*
       * Initialising socket connection again, making sure we also re-initialise chat surface
       * with greeting and watermark.
       */
      this.initSession = true;
      this.initSocket(function() {

        // Initialising chat surface with watermark and greeting
        this.initialiseChatSurface();

      }.bind(this));
    },

    /*
     * Hides the chat window.
     */
    hide: function() {

      // Shows chat button.
      const btn = document.getElementById('ainiro_chat_btn');
      btn.classList.remove('ainiro_hide');

      // Hides chat window.
      const wnd = document.getElementById('ainiro_chat_wnd');
      wnd.classList.remove('show_ainiro_chatbot');

      // Making sure body element cannot scroll.
      document.body.style.height = '';
      document.body.style.overflowY = '';

      // Showing Shopify chat again (if it exists on page).
      const shopifyChatbot = document.getElementById('shopify-chat');
      if (shopifyChatbot) {
        shopifyChatbot.style.display = 'block';
      }
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

      // Adding message to surface container.
      const surf = document.getElementById('ainiro_chat_surf');
      surf.appendChild(el);
    },

    /*
     * Invoked when form is submitted.
     */
    submit: function() {

      // Making sure user provided any actual text.
      const txtEl = document.getElementById('ainiro_txt');
      if (txtEl.value.trim() === '') {
        return;
      }

      // Disabling send button.
      const btn = document.getElementById('ainiro_send');
      btn.disabled = true;

      // Making sure we remove conversation starters if they're in the DOM.
      const wrp = document.getElementById('ainiro_starter');
      if (wrp) {
        wrp.parentNode.removeChild(wrp);
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
      const txtEl = document.getElementById('ainiro_txt');
      if (txtEl.value.trim() === '') {
        return;
      }

      // Disabling send button.
      const btn = document.getElementById('ainiro_send');
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
        const txtbox = document.getElementById('ainiro_txt');
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
          const html = marked.parse(errObj.message);

          // Updating value of last chat message.
          const surf = document.getElementById('ainiro_chat_surf');
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
         *
         * This is needed to avoid having animations trigger again if chatbot is closed and re-opened.
         */
        const surf = document.getElementById('ainiro_chat_surf');
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
            const btn = document.getElementById('ainiro_send');
            btn.disabled = false;

            // Returning early.
            return;
          }

          // Removing animation class for last chatbot question.
          this.askQuestion();

          // Scrolling to bottom to make sure user sees the question.
          this.scrollToBottom(true, true);

        } else {

          // Enabling send button.
          const btn = document.getElementById('ainiro_send');
          btn.disabled = false;
        }

      }, 800);
    },

    /*
     * Submits question to chatbot.
     */
    submitQuestion: function(token) {

      // Retrieving query input field and disabling it.
      const txtEl = document.getElementById('ainiro_txt');
      if (txtEl.value.trim() === '') {
        return;
      }

      // Disabling send button.
      const btn = document.getElementById('ainiro_send');
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
      let url = this.ainiro_settings.url +
        `/magic/system/openai/chat?prompt=` +
        encodeURIComponent(txtEl.value) +
        '&type=' + type +
        '&session=' + this.session +
        '&user_id=' + this.userId +
        '&chat=true&stream=true' +
        '&referrer=' + encodeURIComponent(window.location.href) +
        '&extra=' + encodeURIComponent(this.ainiro_settings.extra);
      if (token) {
        url += '&recaptcha_response=' + encodeURIComponent(token);
      }
      if (this.ainiro_settings.references) {
        url += '&references=true';
      }

      // Resetting onDone.
      this.onDone = null;

      // Resetting references.
      this.references_list = [];

      // Invoking backend.
      fetch(url, {
        method: 'GET'
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
        const txtbox = document.getElementById('ainiro_txt');
        txtbox.value = '';

      }).catch(err => {

        // Oops, error.
        err.json().then(errObj => {

          // Appending message to temporary response.
          const html = marked.parse(errObj.message);

          // Updating value of last chat message.
          const surf = document.getElementById('ainiro_chat_surf');
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
    chatMessageDone: function(response) {

      // Defaulting Markdown to be transformed to entire result from server.
      let wholeMarkdown = response;

      // Buffer for follow up questions. This will be empty if we don't have follow up questions.
      let followUpQuestions = [];

      /*
       * We only extract follow up questions if chatbot has been configured to do so,
       * and server returned more than one section.
       */
      const markdownSections = wholeMarkdown.split('\n---');
      if (this.ainiro_settings.follow_up && markdownSections.length > 1) {
        followUpQuestions = markdownSections.pop();
        wholeMarkdown = markdownSections.join('\n---').trim();
      }
      const html = marked.parse(wholeMarkdown);

      // Updating value of last chat message.
      const surf = document.getElementById('ainiro_chat_surf');
      const msg = surf.childNodes[surf.childNodes.length - 1];
      msg.innerHTML = html;

      // Checking if we've got code syntax highlighting turned on.
      if (this.ainiro_settings.code === true) {

        // Finding all PRE elements.
        for (let idx = 0; idx < msg.childNodes.length; idx++) {

          // Verifying it's a PRE element.
          if (msg.childNodes[idx].tagName === 'PRE') {

            // Highlighting element.
            hljs.highlightElement(msg.childNodes[idx]);

            // Adding a "copy code" button.
            // Notice, this is done with HTML to allow for navigating to new pages, without losing logic.
            msg.childNodes[idx].innerHTML = msg.childNodes[idx].innerHTML + '<button class="copy_code_button" onclick="ainiro.copyCode(event)"><i class="ainiro-icofont ainiro-icofont-copy"></i></button>';
          }
        }
      }

      // Adding references immediately.
      this.addReferences(this.references);

      // Checking if we've got follow up questions.
      if (followUpQuestions.length > 0) {

        // Parsing follow up questions.
        const followUp = [];
        const html = marked.parse(followUpQuestions);
        const domRoot = document.createElement('div');
        domRoot.innerHTML = html;

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
      const surf = document.getElementById('ainiro_chat_surf');
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
      const btn = document.getElementById('ainiro_send');
      btn.disabled = false;

      // Retrieving surface for chat messages.
      const surf = document.getElementById('ainiro_chat_surf');

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

        /*
         * Setting query to either specified message or innerText of element clicked,
         * prioritizing explicit msg argument.
         */
        const query = document.getElementById('ainiro_txt');
        query.value = question;

        /*
         * Verifying user actually has a quesiton before we're trying to submit form.
         *
         * Since we're using the same function for FAQ questions and external trigger buttons,
         * we need to check if we actually have a question before we try to submit the prompt.
         */
        if (question && question !== '') {

          // Submitting form to retrieve answer to question.
          this.submit();
        }
      });
    }
  };

  // Initializing chatbot.
  ainiro.init();

  // Making sure we're backwards compatible with FAQ invocations.
  window.ainiro_faq_question = window.ainiro.ask.bind(window.ainiro);

  // Internal function to ask follow up question.
  window.ask_follow_up = function(e) {

    // Changing value of textbox.
    const query = document.getElementById('ainiro_txt');
    const question = e.srcElement.innerText;
    query.value = question;

    // Submitting form to retrieve answer to question.
    window.ainiro.submit();
  }

})();
