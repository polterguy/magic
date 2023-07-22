
/*
 * Default JavaScript file for OpenAI chat inclusion.
 */
(function() {

// True if caller wants "references" as in site search.
let aistaChatSearch = [[search]];

// True if caller wants "chatting" support.
let aistaChatChat = [[chat]];

// True if caller wants Markdown support.
let aistaChatMarkdown = [[markdown]];

// Greeting to welcome user with.
let aistaChatGreeting = '[[greeting]]';

// RTL support.
let ainiroRtl = [[rtl]];

// True if speech is turned on.
let aistaSpeech = [[speech]];

fetch('https://ainiro.io/assets/css/icofont.min.css')
  .then(res => {
    return res.text()
  })
  .then(res => {

    // Injecting CSS into DOM.
    var css = document.createElement('style');
    css.innerHTML = res;
    window.document.getElementsByTagName('head')[0].appendChild(css);
});

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

// Retrieving session identifier site key.
let aistaSession = null;
fetch('[[url]]/magic/system/misc/gibberish?min=20&max=30', {
  method: 'GET',
}).then(res => {
  return res.json();
}).then(res => {
  aistaSession = res.result;
});

// Downloading ShowdownJS to be able to parse Markdown.
if (aistaChatMarkdown) {

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
}


// Creating CSS inclusion.
fetch('[[url]]/magic/system/openai/include-style?file=' + encodeURIComponent('[[css]]'))
  .then(res => {
    return res.text()
  })
  .then(res => {

    // Injecting CSS into DOM.
    var css = document.createElement('style');
    css.innerHTML = res;
    window.document.getElementsByTagName('head')[0].appendChild(css);

    // Creating our chat UI.
    aista_create_chat_ui();
});

const ainiro_has_submit_button = [[submit_button]];

/*
 * Function creating our chat UI.
 */
function aista_create_chat_ui() {

  // Creating chat button if we should.
  if ('[[render_button]]' === 'True') {
    const aistaChatBtn = window.document.createElement('button');
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
  }

  // Chat window.
  const aistaChatWnd = window.document.createElement('div');
  if (ainiroRtl && ainiroRtl === true) {
    aistaChatWnd.dir = 'rtl';
  }
  aistaChatWnd.className = 'aista-chat-wnd';
  let html = `
  <div class="aista-chat-header">[[header]]</div>
  <div class="aista-chat-msg-container"></div>
  <button class="aista-chat-close-btn"><i class="icofont-close"></i></button>
  <form class="aista-chat-form">
  <input type="text" placeholder="Ask me anything ..." class="aista-chat-prompt">`;

  // Notice, we can't have both speech recognition and submit button.
  if (aistaSpeech) {
    html += `<button type="button" class="aista-speech-button fas fa-microphone"></button>`;
    const fontAwesome = window.document.createElement('script');
    fontAwesome.src = 'https://kit.fontawesome.com/a076d05399.js';
    fontAwesome.crossorigin = 'anonymous';
    window.document.getElementsByTagName('head')[0].appendChild(fontAwesome);
  } else if (ainiro_has_submit_button) {
    html += `<button type="submit" class="aista-speech-button"><i class="icofont-location-arrow"></i></button>`;
  }
  html += '</form>';
  aistaChatWnd.innerHTML = html;
  window.document.body.appendChild(aistaChatWnd);

  // Adding event listener to input field to allow for closing it with escape key.
  const aistaChatInpField = document.getElementsByClassName('aista-chat-prompt')[0];
  aistaChatInpField.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      aistaChatWnd.style.display = 'none';
      const btns = window.document.getElementsByClassName('aista-chat-btn');
      if (btns.length > 0) {
        btns[0].style.display = 'block';
      }
    }
  });

  // Add an event listener to the close button.
  window.document.getElementsByClassName('aista-chat-close-btn')[0].addEventListener('click', () => {
    aistaChatWnd.style.display = 'none';
    const btns = window.document.getElementsByClassName('aista-chat-btn');
    if (btns.length > 0) {
      btns[0].style.display = 'block';
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

  // Checking if we've got a greeting, and if so, adding it as initial chat message.
  if (aistaChatGreeting && aistaChatGreeting.length > 0) {
    const row = window.document.createElement('div');
    row.innerText = aistaChatGreeting;
    row.className = 'aista-chat-answer cached';
    const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
    msgs.appendChild(row);
  }
}

/*
 * Submits form to backend.
 */
function aista_submit_form(speech) {
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
  setTimeout(() => {
    msgEl.scrollIntoView({behavior: 'smooth', block: 'start'});
  }, 1)
  inp.disabled = true;

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

/*
 * Shows chat window.
 */
function aista_show_chat_window() {

  // Ensuring we fetch reCAPTCHA stuff.
  ensureReCaptchaHasBeenFetched();

  const wnd = window.document.getElementsByClassName('aista-chat-wnd')[0];
  wnd.style.display = 'block';
  const btns = window.document.getElementsByClassName('aista-chat-btn');
  if (btns.length > 0) {
    btns[0].style.display = 'none';
  }
  const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
  setTimeout(() => {
    inp.focus();
    inp.select();
  }, 250)
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

  // Creating our URL.
  let url = `[[url]]/magic/system/openai/chat?prompt=` + encodeURIComponent(msg) + '&type=[[type]]';
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
  if (aistaSession) {
    url += '&session=' + encodeURIComponent(aistaSession);
  }

  // Invoking backend, with reCAPTCHA response if we've got a site-key
  fetch(url, {
    method: 'GET',
  })
    .then(res => {
      if (res.status >= 200 && res.status <= 299) {
        return res.json();
      } else if (res.status === 499) {
        throw Error('Access denied, missing reCAPTCHA. Either configure your model to not use reCAPTCHA, or setup reCAPTCHA for your bot');
      } else if (res.status === 401) {
        throw Error('Your model requires authentication, and you are not authorised to invoking it. Either turn off all roles, or add JWT token to requests somehow.');
      } else if (res.status === 429) {
        throw Error('Seriously, it is not us! OpenAI is overloaded. If it continues, try using \'text-curie-001\' as your \'transformer\' model instead of \'text-davinci-001\'. It is not as \'smart\', but much faster, and way more stable.');
      } else {
        throw Error(res.statusText);
      }
    })
    .then(data => {

      // Enabling input textbox such that user can ask next question
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
    
      // Scrolling message row into view.
      msgRow.scrollIntoView({behavior: 'smooth', block: 'start'});

      // Checking if we're supposed to speak the result.
      if (aistaSpeech && speech) {
        let utterance = new SpeechSynthesisUtterance(data.result);
        speechSynthesis.speak(utterance);
      }
    })
    .catch(error => {

      // Enabling input textbox such that user can ask next question
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
      const msg = error.message === 'Too Many Requests' ? 'OpenAI is overloaded, try again later' : error.message;
      row.innerText = msg;
      const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
      msgs.appendChild(row);

      // Removing flashing on question
      const msgRow = window.document.getElementsByClassName('aista-chat-question-waiting')[0];
      msgRow.className = 'aista-chat-question';
      msgRow.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
}})();
