
/*
 * Default JavaScript file for OpenAI chat inclusion.
 */
(function() {

// True if caller wants "references" as in site search.
const aistaChatSearch = [[search]];

// True if caller wants "chatting" support.
const aistaChatChat = [[chat]];

// True if caller wants Markdown support.
const aistaChatMarkdown = [[markdown]];

// Greeting to welcome user with.
const aistaChatGreeting = '[[greeting]]';

// RTL support.
const ainiroRtl = [[rtl]];

// True if we're using streams.
const ainiroStream = [[stream]];

// True if speech is turned on.
const aistaSpeech = [[speech]];

// True if we have a submit button.
const ainiro_has_submit_button = [[submit_button]];

// This is the parent DOM element of the chat window, if null, it is embedded into body.
const ainiroParentElement = '[[parent_node]]';

// Used for references.
let ainiro_references = [];

// Type or model to use.
let ainiroChatbotType = '[[type]]';

/*
 * "API method" for FAQ questions.
 */
window.ainiro_faq_question = function(e) {

  const question = e.srcElement.innerHTML;
  aista_show_chat_window();
  setTimeout(() => {
    const prompt = document.getElementsByClassName('aista-chat-prompt')[0];
    if (!ainiroQuestionnaire.questions || ainiroQuestionnaire.questions.length === 0) {
      prompt.value = question;
      prompt.focus();
      prompt.select();
    }
  }, 1);
  e.preventDefault();
  e.stopPropagation();
}

// Downloading icofont, making sure we only download it once.
if (!window.ainiroHasDownloadIcofont) {
  window.ainiroHasDownloadIcofont = true;
  const icofontCss = window.document.createElement('link');
  icofontCss.href = 'https://ainiro.io/assets/css/icofont.min.css?v=[[ainiro_version]]';
  icofontCss.rel = 'stylesheet';
  window.document.getElementsByTagName('head')[0].appendChild(icofontCss);
}

let recaptchaFetched = false;

let aistaReCaptchaSiteKey = '[[recaptcha]]';
function ensureReCaptchaHasBeenFetched() {
  // Retrieving reCAPTCHA site key unless it's already been fetched.
  if (recaptchaFetched) {
    return;
  }
  recaptchaFetched = true;
  if (aistaReCaptchaSiteKey && aistaReCaptchaSiteKey.length > 0) {

    // Including reCAPTCHA version 3
    const cap = window.document.createElement('script');
    cap.src = 'https://www.google.com/recaptcha/api.js?render=' + aistaReCaptchaSiteKey;
    window.document.getElementsByTagName('head')[0].appendChild(cap);
  }
}

// This is our session identifier, implying one user session.
let aistaSession = null;

// This is our user id, implying one unique user.
let ainiroUserId = null;

// Downloading ShowdownJS to be able to parse Markdown.
let hasDownloadedShowdownHighlight = false;

// CSS file to use as theme.
let ainiroChatbotCssFile = '[[css]]';

// Checking if there's a global callback for dynamically including CSS file.
if (window.getAiniroChatbotCssFile) {
  ainiroChatbotCssFile = window.getAiniroChatbotCssFile() ?? ainiroChatbotCssFile;
}

// Fetching theme's CSS file and including on page
window.ainiroHasDownloadIcofont = true;
const icofontCss = window.document.createElement('link');
icofontCss.href = '[[url]]/magic/system/openai/include-style?file=' + encodeURIComponent(ainiroChatbotCssFile) + '&v=[[ainiro_version]]';
icofontCss.rel = 'stylesheet';
window.document.getElementsByTagName('head')[0].appendChild(icofontCss);

/*
 * Function creating our chat UI.
 */
function aista_create_chat_ui() {

  // Creating chat button if we should.
  if ('[[render_button]]' === 'True') {
    const aistaChatBtn = window.document.createElement('button');
    aistaChatBtn.style.display = 'none';
    if (ainiroRtl && ainiroRtl === true) {
      aistaChatBtn.dir = 'rtl';
    }
    let btnTxt = '[[button]]';
    if (btnTxt === '') {
      btnTxt = '<i class="icofont-chat"></i>';
    }
    aistaChatBtn.innerHTML = btnTxt;
    aistaChatBtn.ariaLabel = 'Chat with website';
    aistaChatBtn.className = 'aista-chat-btn';
    aistaChatBtn.addEventListener('click', () => aista_show_chat_window());
    window.document.body.appendChild(aistaChatBtn);

    // In case we're using a custom theme.
    setTimeout(() => {
      aistaChatBtn.style.display = 'block';
    }, 500);
  }

  // Chat window.
  const aistaChatWnd = window.document.createElement('div');
  if (ainiroRtl && ainiroRtl === true) {
    aistaChatWnd.dir = 'rtl';
  }
  const ainiroWatermarkContent = '[[ainiro_watermark]]';
  aistaChatWnd.className = 'aista-chat-wnd';
  aistaChatWnd.style.display = 'none';
  let html = `
  <div class="ainiro-powered-by" style="display: none">
    ${ainiroWatermarkContent}
  </div>
  <div class="aista-chat-header">[[header]]</div>
  <div class="aista-chat-msg-container"></div>
  <button class="aista-chat-close-btn"><i class="icofont-close"></i></button>
  <form class="aista-chat-form">
  <input type="text" placeholder="Ask me anything ..." class="aista-chat-prompt">`;

  // Notice, we can't have both speech recognition and submit button.
  if (aistaSpeech) {
    html += `<button type="button" class="aista-speech-button"><i class="icofont-microphone"></i></button>`;
  } else if (ainiro_has_submit_button) {
    html += `<button type="submit" class="aista-speech-button"><i class="icofont-location-arrow"></i></button>`;
  }
  html += '</form>';
  aistaChatWnd.innerHTML = html;
  if (ainiroParentElement && ainiroParentElement !== '') {
    document.getElementById(ainiroParentElement).appendChild(aistaChatWnd);
    aista_show_chat_window();
  } else {
    window.document.body.appendChild(aistaChatWnd);
  }

  if (!ainiroParentElement || ainiroParentElement === '') {

    // Adding event listener to input field to allow for closing it with escape key.
    const aistaChatInpField = document.getElementsByClassName('aista-chat-prompt')[0];
    aistaChatInpField.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        aistaChatWnd.style.display = 'none';
        const btns = window.document.getElementsByClassName('aista-chat-btn');
        if (btns.length > 0) {
          btns[0].style.display = 'block';
        }
        if (ainiro_con) {
          ainiro_con.stop();
          ainiro_con = null;
        }
      }
    });
  }

  // Add an event listener to the close button.
  window.document.getElementsByClassName('aista-chat-close-btn')[0].addEventListener('click', () => {
    aistaChatWnd.style.display = 'none';
    const btns = window.document.getElementsByClassName('aista-chat-btn');
    if (btns.length > 0) {
      btns[0].style.display = 'block';
    }
    if (ainiro_con) {
      ainiro_con.stop();
      ainiro_con = null;
    }
  });

  // Add an event listener to the microphone button.
  if (aistaSpeech) {
    window.document.getElementsByClassName('aista-speech-button')[0].addEventListener('click', () => {
      var recognition = new webkitSpeechRecognition();
      recognition.onresult = function(event) {
        var output = document.getElementsByClassName('aista-chat-prompt')[0];
        output.value = event.results[0][0].transcript;
        output.select();
        output.focus();
        aista_submit_form(true);
      };
      recognition.start();
    });
  }

  // Add a submit event handler to the form
  window.document.getElementsByClassName('aista-chat-form')[0].addEventListener('submit', (e) => {
    e.preventDefault();
    aista_submit_form(false);
  });

  const ainiroSessionItems = sessionStorage.getItem('ainiro_session_items');
  if (ainiroSessionItems) {

    // We've got an existing session, initialising our chat window with HTML from session.
    const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
    msgs.innerHTML = ainiroSessionItems;

  } else if (aistaChatGreeting && aistaChatGreeting.length > 0) {

    // We've got a greeting, adding it as initial chat message.
    const row = window.document.createElement('div');
    row.innerHTML = aistaChatGreeting;
    row.className = 'aista-chat-answer cached';
    const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
    msgs.appendChild(row);
  }

  // Checking if we've got a global callback that should be invoked as we've created our window.
  if (window.ainiroInitializeChatWindow) {
    window.ainiroInitializeChatWindow();
  }
}

function ainiro_create_wait_animation() {

  const row = window.document.createElement('div');
  row.className = 'aista-chat-answer ainiro-waiting-animation';
  row.innerHTML = '<span class="ainiro-dot-1"></span><span class="ainiro-dot-2"></span><span class="ainiro-dot-3"></span>';
  const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
  msgs.appendChild(row);
}

function ainiro_delete_wait_animation() {
  const els = window.document.querySelector('.ainiro-waiting-animation');
  if (els) {
    els.parentNode.removeChild(els);
    return true;
  }
  return false;
}

/*
 * Submits form to backend.
 */
var ainiro_con = null;
var ainiroTempContent = '';
function aista_submit_form(speech) {
  if (!ainiroStream || ainiro_con) {
    aista_submit_form_impl(speech);
  } else {
    ainiro_con = new signalR.HubConnectionBuilder()
      .withAutomaticReconnect()
      .withUrl('[[url]]/sockets', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      }).build();
    ainiro_con.on(aistaSession, function (args) {

      // Turning test response into JavaScript object.
      var obj = JSON.parse(args);

      // Checking if we're done
      if (obj.finished === true || obj.error === true) {

        // Last response, enabling speech/submit button, and input textbox, such that user can ask next question.
        const speechBtns = window.document.getElementsByClassName('aista-speech-button');
        if (speechBtns?.length > 0) {
          speechBtns[0].disabled = false;
        }
        const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
        inp.disabled = false;
        inp.value = '';
        inp.focus();
        const answer = window.document.getElementsByClassName('ainiro-has-more')[0];
        answer.className = answer.className.replace(' ainiro-has-more', '');
        if (obj.error === true) {
          answer.className += ' aista-chat-error';
          answer.innerHTML = 'Something went wrong while invoking OpenAI, status was; ' + obj.status +
            ' and message from OpenAI was; \'' + obj.message + '\'';
        }
        ainiroTempContent = '';

        // Checking if server returned references.
        if (ainiro_references.length > 0) {
          const list = window.document.createElement('ul');
          list.className = 'aista-references-list';
          for (const idx of ainiro_references) {
            const li = window.document.createElement('li');
            const hyp = window.document.createElement('a');
            hyp.setAttribute('href', idx.uri);
            hyp.setAttribute('target', '_blank');
            hyp.innerHTML = idx.prompt;
            li.appendChild(hyp);
            list.appendChild(li);
          }
          answer.appendChild(list);
        }

        // Storing HTML to session.
        const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
        sessionStorage.setItem('ainiro_session_items', msgs.innerHTML);
        return; // Returning early ...
      }

      if (obj.finish_reason) {

        // We've got a finish reason from OpenAI.
        const answer = window.document.getElementsByClassName('ainiro-has-more')[0];
        answer.className = answer.className + ' ' + obj.finish_reason;
        return;
      }

      // Appending response to temporary result.
      ainiroTempContent += obj.message;

      if (ainiro_delete_wait_animation()) {

        // First response from server, removing animation on message element.
        const msgRow = window.document.getElementsByClassName('aista-chat-question-waiting')[0];
        msgRow.className = 'aista-chat-question';

        // Appending answer to message container
        const row = window.document.createElement('div');
        if (aistaChatMarkdown) {
          const converter = new showdown.Converter();
          row.innerHTML = converter.makeHtml(ainiroTempContent);
          const images = row.querySelectorAll('img');
          for (const idxImg of images) {
            if (idxImg.parentElement.tagName.toLowerCase() !== 'a') {
              idxImg.addEventListener('click', () => aista_zoom_image(idxImg));
            }
          }
          row.querySelectorAll('pre code').forEach((el) => {
            hljs.highlightElement(el);
          });
        } else {
          row.innerText = ainiroTempContent;
        }
        row.className = 'aista-chat-answer ainiro-has-more';
        const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
        msgs.appendChild(row);

        // Scrolling message row into view.
        if (!ainiroParentElement || ainiroParentElement === '') {
          msgRow.scrollIntoView({behavior: 'smooth', block: 'start'});
        }

      } else {

        // NOT first response from server.
        const row = window.document.getElementsByClassName('ainiro-has-more')[0];
        if (aistaChatMarkdown) {
          const converter = new showdown.Converter();
          row.innerHTML = converter.makeHtml(ainiroTempContent);
          const images = row.querySelectorAll('img');
          for (const idxImg of images) {
            idxImg.addEventListener('click', () => aista_zoom_image(idxImg));
          }
          row.querySelectorAll('pre code').forEach((el) => {
            hljs.highlightElement(el);
          });
        } else {
          row.innerText = ainiroTempContent;
        }
      }
    });
    ainiro_con.start().then(function () {
      aista_submit_form_impl(speech);
    }).catch(function (err) {
      return console.error(err.toString());
    });
  }
}

function aista_submit_form_impl(speech) {
  const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
  const msg = inp.value;
  if (!msg || msg === '') {
    return;
  }
  const msgEl = window.document.createElement('div');
  msgEl.innerText = msg;
  msgEl.className = 'aista-chat-question-waiting';
  const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
  msgs.appendChild(msgEl);
  if (!ainiroParentElement || ainiroParentElement === '') {
    setTimeout(() => {
      msgEl.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 1);
  }
  inp.disabled = true;

  ainiro_create_wait_animation();

  const speechBtns = window.document.getElementsByClassName('aista-speech-button');
  if (speechBtns?.length > 0) {
    speechBtns[0].disabled = true;
  }

  // Invoking backend, making sure we associate request with reCAPTCHA token if possible
  if (aistaReCaptchaSiteKey) {
    grecaptcha.ready(function() {
      grecaptcha.execute(aistaReCaptchaSiteKey, {action: 'submit'}).then(function(token) {
        aista_invoke_prompt(msg, token, speech);
      });
    });
  } else {
    aista_invoke_prompt(msg, null, speech);
  }
}

let ainiroHasFetchedQuestionnaire = false;
let ainiroQuestionnaire = {};
let ainiroQuestionnaireAnswers = [];

/*
 * Fetches initial questionnaire.
 */
function ensureInitialQuestionnaireIsFetched() {

  if (ainiroHasFetchedQuestionnaire === true) {
    return;
  }

  // Disabling prompt input until we've fetched questionnaire.
  const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
  inp.disabled = true;
  ainiroHasFetchedQuestionnaire = true;
  if (window.getAiniroChatbotType) {
    ainiroChatbotType = window.getAiniroChatbotType() ?? ainiroChatbotType;
  }
  fetch('[[url]]/magic/system/openai/questionnaire?type=' + encodeURIComponent(ainiroChatbotType))
    .then(res => {
      return res.text()
    })
    .then(res => {

      // Storing initial questions.
      ainiroQuestionnaire = JSON.parse(res || '{}');

      // Need access to prompt input element.
      const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];

      // Enabling prompt input.
      inp.disabled = false;
      if (!ainiroParentElement || ainiroParentElement === '') {
        inp.focus();
      }

      // Checking if we have a questionnaire, and if not, returning early.
      if (!ainiroQuestionnaire.name) {
        return;
      }

      /*
      * Checking if this is a 'single-shot' type of questionnaire,
      * at which point we drop it if user has answered it before.
      */
      if (ainiroQuestionnaire.type === 'single-shot') {

        // Checking local storage to see if user has answered before.
        const previousQuestionnaire = localStorage.getItem('ainiro-questionnaire.' + ainiroQuestionnaire.name);
        if (previousQuestionnaire !== null) {

          // User has previously answered questionnaire, and it's a 'single-shot' questionnaire.
          ainiroQuestionnaire = {};

        } else {

          // We've got a questionnaire
          inp.value = '';
        }
      } else {

        // We've got a questionnaire
        inp.value = '';
      }

      // Starting questionnaire loop.
      askNextQuestion();
    });
}

// Contains all action values for questionnaire.
const questionnaireActionValues = {};

/*
 * Function that loops through questionnaire asking questions until no more
 * questions remains in ainiroQuestionnaire array.
 */
function askNextQuestion(justAsked = false) {

  // Verifying we've got more questions remaining.
  if (!ainiroQuestionnaire.questions || ainiroQuestionnaire.questions?.length === 0) {
    if (ainiroQuestionnaire.name && ainiroQuestionnaire.type === 'single-shot') {

      // Storing the fact that user has taken this questionnaire in local storage.
      localStorage.setItem('ainiro-questionnaire.' + ainiroQuestionnaire.name, JSON.stringify(ainiroQuestionnaireAnswers));
    }
    if(justAsked === true && ainiroQuestionnaire.action) {

      // Done with questionnaire, invoking action on the server
      const payload = {
        action: ainiroQuestionnaire.action,
        values: questionnaireActionValues,
      };
      let url = `[[url]]/magic/system/openai/questionnaire-action`;
      fetch(url, {
        method: 'POST',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (res.status >= 200 && res.status <= 299) {
            return res.json();
          } else {
            throw Error(res.statusText);
          }
        })
        .then(() => {
          console.log('Successfully invoked action for questionnaire');
        });
      }
    return;
  }
  const row = window.document.createElement('div');
  row.innerText = ainiroQuestionnaire.questions[0].question;
  row.className = 'aista-chat-answer stop';
  const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
  msgs.appendChild(row);

  // Scrolling message row into view.
  if (!ainiroParentElement || ainiroParentElement === '') {
    row.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  // Checking type of question.
  if (ainiroQuestionnaire.questions[0].type === 'message') {
    ainiroQuestionnaire.questions = ainiroQuestionnaire.questions.slice(1);
    askNextQuestion(true);
  }
}

/*
 * Shows chat window.
 */
function aista_show_chat_window() {

  // Ensuring we've got a unique user ID to associate chat session with.
  if (!ainiroUserId) {
    const oldUserId = localStorage.getItem('ainiroUserId');
    if (oldUserId) {
      ainiroUserId = oldUserId;
    } else {
      // Creating a new unique user ID to associate session with.
      fetch('[[url]]/magic/system/misc/gibberish?min=20&max=30', {
        method: 'GET',
      }).then(res => {
        return res.json();
      }).then(res => {
        ainiroUserId = res.result;
        localStorage.setItem('ainiroUserId', ainiroUserId);
      });
    }
  }

  // Ensuring we fetch reCAPTCHA stuff.
  ensureReCaptchaHasBeenFetched();

  // Ensuring we fetch initial questionnaire.
  ensureInitialQuestionnaireIsFetched();

  // Checking if we're using SignalR.
  if (ainiroStream) {
    const sock = window.document.createElement('script');
    sock.src = 'https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.min.js';
    window.document.getElementsByTagName('head')[0].appendChild(sock);
  }

  // Ensuring we've got a session identifier.
  if (!aistaSession) {
    const oldSession = sessionStorage.getItem('ainiro_session');
    if (oldSession) {
      aistaSession = oldSession;
    } else {
      fetch('[[url]]/magic/system/misc/gibberish?min=20&max=30', {
        method: 'GET',
      }).then(res => {
        return res.json();
      }).then(res => {
        aistaSession = res.result;
        sessionStorage.setItem('ainiro_session', res.result);
      });
    }
  }

  // Checking if we're using Markdown, and if so, downloading showdown and highlight.
  if (aistaChatMarkdown) {
    if (hasDownloadedShowdownHighlight === false) {

      // Including ShowdownJS.
      const showdownJS = window.document.createElement('script');
      showdownJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.0/showdown.min.js';
      window.document.getElementsByTagName('head')[0].appendChild(showdownJS);

      // Including HighlightJS.
      const highlightJS = window.document.createElement('script');
      highlightJS.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/highlight.min.js';
      window.document.getElementsByTagName('head')[0].appendChild(highlightJS);

      const highlightJSCSS = window.document.createElement('link');
      highlightJSCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css';
      highlightJSCSS.rel = 'stylesheet';
      window.document.getElementsByTagName('head')[0].appendChild(highlightJSCSS);
      hasDownloadedShowdownHighlight = true;
    }
  }

  const wnd = window.document.getElementsByClassName('aista-chat-wnd')[0];
  wnd.style.display = 'block';
  const btns = window.document.getElementsByClassName('aista-chat-btn');
  if (btns.length > 0) {
    btns[0].style.display = 'none';
  }

  // Scrolling to bottom in case we've got session messages.
  if (!ainiroParentElement || ainiroParentElement === '') {
    const allMsgs = window.document.getElementsByClassName('aista-chat-question');
    if (allMsgs && allMsgs.length > 0) {
      allMsgs[allMsgs.length - 1].scrollIntoView({behavior: 'instant', block: 'start'});
    }
  }

  // Setting focus to input textbox.
  if (!ainiroParentElement || ainiroParentElement === '') {
    const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
    setTimeout(() => {
      inp.focus();
      inp.select();
    }, 250);
  }
}

function aista_zoom_image(img) {
  const lb = document.createElement('div');
  lb.id = 'aista_zoom_image';
  lb.className = 'aista-zoom-image';
  lb.addEventListener('click', () => {
    window.document.getElementsByTagName('body')[0].removeChild(lb);
  });
  const im = document.createElement('img');
  im.src = img.src;
  im.alt = img.alt;
  lb.appendChild(im);
  window.document.getElementsByTagName('body')[0].appendChild(lb);
}

/*
 * Function that invokes our backend with the prompt to retrieve completion.
 */
function aista_invoke_prompt(msg, token, speech) {

  // Checking if we're in a questionnaire loop.
  if (ainiroQuestionnaire.questions?.length > 0) {

    // Checking if this is a "named" question.
    if (ainiroQuestionnaire.questions[0].name) {
      questionnaireActionValues[ainiroQuestionnaire.questions[0].name] = msg;
    }

    // Creating our URL.
    let url = `[[url]]/magic/system/openai/answer`;

    // Creating our payload.
    if (window.getAiniroChatbotType) {
      ainiroChatbotType = window.getAiniroChatbotType() ?? ainiroChatbotType;
    }
    let payload = {
      type: ainiroChatbotType
    };
    if (token) {
      payload.recaptcha_response = token;
    }
    if (aistaSession) {
      payload.session = aistaSession;
    }
    if (ainiroUserId) {
      payload.user_id = ainiroUserId;
    }
    payload.question = ainiroQuestionnaire.questions[0].question;
    payload.context = ainiroQuestionnaire.questions[0].context;
    ainiroQuestionnaireAnswers.push({
      question: ainiroQuestionnaire.questions[0].question,
      answer: msg,
      context: ainiroQuestionnaire.questions[0].context,
      name: ainiroQuestionnaire.questions[0].name,
    });
    ainiroQuestionnaire.questions = ainiroQuestionnaire.questions.slice(1);
    payload.answer = msg;

    // Invoking backend, with reCAPTCHA response if we've got a site-key
    fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.status >= 200 && res.status <= 299) {
          return res.json();
        } else {
          throw Error(res.statusText);
        }
      })
      .then(() => {

        // Enabling input textbox such that user can ask next question
        const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
        inp.disabled = false;
        inp.value = '';
        inp.focus();

        // Removing flashing on question
        const msgRow = window.document.getElementsByClassName('aista-chat-question-waiting')[0];
        msgRow.className = 'aista-chat-question';

        ainiro_delete_wait_animation();

        // Making sure form submit button and speech button are enabled.
        const speechBtns = window.document.getElementsByClassName('aista-speech-button');
        if (speechBtns?.length > 0) {
          speechBtns[0].disabled = false;
        }

        // Asking next question, if we've got more questions in our questionnaire.
        askNextQuestion(true);
      });

  } else {

    // Creating our URL.
    if (window.getAiniroChatbotType) {
      ainiroChatbotType = window.getAiniroChatbotType() ?? ainiroChatbotType;
    }
    let url = `[[url]]/magic/system/openai/chat?prompt=` + encodeURIComponent(msg) + '&type=' + ainiroChatbotType;
    if (token) {
      url += '&recaptcha_response=' + encodeURIComponent(token);
    }
    if (aistaChatSearch) {
      url += '&references=true';
    }
    if (aistaChatChat) {
      url += '&chat=true';
    } else {
      url += '&chat=false';
    }
    if (ainiroStream) {
      url += '&stream=true';
    } else {
      url += '&stream=false';
    }
    if (aistaSession) {
      url += '&session=' + encodeURIComponent(aistaSession);
    }
    if (ainiroUserId) {
      url += '&user_id=' + encodeURIComponent(ainiroUserId);
    }

    // Invoking backend, with reCAPTCHA response if we've got a site-key
    fetch(url, {
      method: 'GET',
    })
      .then(res => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .then(data => {

        // Verifying we're not streaming result.
        if (data.stream) {

          // Storing reference such that we can create these once the last socket message has been received.
          ainiro_references = data.references ?? [];

        } else {

          // Enabling input textbox such that user can ask next question
          const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
          inp.disabled = false;
          inp.value = '';
          inp.focus();
          const speechBtns = window.document.getElementsByClassName('aista-speech-button');
          if (speechBtns?.length > 0) {
            speechBtns[0].disabled = false;
          }

          // Appending answer to message container
          const row = window.document.createElement('div');
          if (aistaChatChat) {
            if (aistaChatMarkdown) {
              const converter = new showdown.Converter();
              row.innerHTML = converter.makeHtml(data.result);
              const images = row.querySelectorAll('img');
              for (const idxImg of images) {
                idxImg.addEventListener('click', () => aista_zoom_image(idxImg));
              }
              row.querySelectorAll('pre code').forEach((el) => {
                hljs.highlightElement(el);
              });
            } else {
              row.innerText = data.result;
            }
          }
          row.className = 'aista-chat-answer ' + data.finish_reason;
          const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
          msgs.appendChild(row);

          // Removing flashing on question
          const msgRow = window.document.getElementsByClassName('aista-chat-question-waiting')[0];
          msgRow.className = 'aista-chat-question';

          ainiro_delete_wait_animation();
        
          // Checking if server returned references.
          if (data.references && data.references.length > 0) {
            const list = window.document.createElement('ul');
            list.className = 'aista-references-list';
            for (const idx of data.references) {
              const li = window.document.createElement('li');
              const hyp = window.document.createElement('a');
              hyp.setAttribute('href', idx.uri);
              hyp.setAttribute('target', '_blank');
              hyp.innerHTML = idx.prompt;
              li.appendChild(hyp);
              list.appendChild(li);
            }
            row.appendChild(list);
          }

          // Storing HTML to session.
          sessionStorage.setItem('ainiro_session_items', msgs.innerHTML);

          // Scrolling message row into view.
          if (!ainiroParentElement || ainiroParentElement === '') {
            msgRow.scrollIntoView({behavior: 'smooth', block: 'start'});
          }

          // Checking if we're supposed to speak the result.
          if (aistaSpeech && speech) {
            let toSpeak = data.result.replace(/!\[.+\]\(.+\)/gi, '');
            let utterance = new SpeechSynthesisUtterance(toSpeak);
            speechSynthesis.speak(utterance);
          }
        }
      })
      .catch(error => {

        // Enabling input textbox such that user can ask next question.
        error.json().then(msg => {

          const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
          inp.disabled = false;
          inp.focus();
          inp.select();
          const speechBtns = window.document.getElementsByClassName('aista-speech-button');
          if (speechBtns?.length > 0) {
            speechBtns[0].disabled = false;
          }
        

          // Appending answer to message container
          const row = window.document.createElement('div');
          row.className = 'aista-chat-error';
          msg = msg.message || 'Connection was unexpectedly closed';
          row.innerText = msg;
          const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
          msgs.appendChild(row);

          // Removing flashing on question
          const msgRow = window.document.getElementsByClassName('aista-chat-question-waiting')[0];
          msgRow.className = 'aista-chat-question';
          if (!ainiroParentElement || ainiroParentElement === '') {
            msgRow.scrollIntoView({behavior: 'smooth', block: 'start'});
          }

          ainiro_delete_wait_animation();
        });
      });
  }
}

  // Creating our chat UI.
  aista_create_chat_ui();
})();
