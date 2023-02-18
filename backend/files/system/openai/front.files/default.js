
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

// Retrieving reCAPTCHA site key.
let aistaReCaptchaSiteKey = null;
fetch('[[url]]/magic/system/auth/recaptcha-key', {
  method: 'GET',
}).then(res => {
  return res.json();
}).then(res => {
  aistaReCaptchaSiteKey = res.result;
  if (aistaReCaptchaSiteKey) {

    // Including reCAPTCHA version 3
    const cap = window.document.createElement('script');
    cap.src = 'https://www.google.com/recaptcha/api.js?render=' + aistaReCaptchaSiteKey;
    window.document.getElementsByTagName('head')[0].appendChild(cap);
  }
});

// Downloading ShowdownJS to be able to parse Markdown.
if (aistaChatMarkdown) {
  const showdownJS = window.document.createElement('script');
  showdownJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.0/showdown.min.js';
  window.document.getElementsByTagName('head')[0].appendChild(showdownJS);
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

/*
 * Function creating our chat UI.
 */
function aista_create_chat_ui() {

  // Creating chat button if we should.
  if ('[[render_button]]' === 'True') {
    const aistaChatBtn = window.document.createElement('button');
    aistaChatBtn.innerHTML = '[[button]]';
    aistaChatBtn.className = 'aista-chat-btn';
    aistaChatBtn.addEventListener('click', () => aista_show_chat_window());
    window.document.body.appendChild(aistaChatBtn);
  }

  // Chat window.
  const aistaChatWnd = window.document.createElement('div');
  aistaChatWnd.className = 'aista-chat-wnd';
  aistaChatWnd.innerHTML = `
  <div class="aista-chat-header">[[header]]</div>
  <div class="aista-chat-msg-container"></div>
  <button class="aista-chat-close-btn">X</button>
  <form class="aista-chat-form">
  <input type="text" placeholder="Ask me anything ..." class="aista-chat-prompt">
  </form>
  `;
  window.document.body.appendChild(aistaChatWnd);

  // Add an event listener to the close button
  window.document.getElementsByClassName('aista-chat-close-btn')[0].addEventListener('click', () => {
    aistaChatWnd.style.display = 'none';
    const btns = window.document.getElementsByClassName('aista-chat-btn');
    if (btns.length > 0) {
      btns[0].style.display = 'block';
    }
  });

  // Add a submit event handler to the form
  window.document.getElementsByClassName('aista-chat-form')[0].addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
    const msg = inp.value;
    const msgEl = window.document.createElement('div');
    msgEl.innerText = msg;
    msgEl.className = 'aista-chat-question-waiting';
    const msgs = window.document.getElementsByClassName('aista-chat-msg-container')[0];
    msgs.appendChild(msgEl);
    setTimeout(() => {
      msgEl.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 1)
    inp.disabled = true;
    
    // Invoking backend, making sure we associate request with reCAPTCHA token if possible
    if (aistaReCaptchaSiteKey) {
      grecaptcha.ready(function() {
        grecaptcha.execute(aistaReCaptchaSiteKey, {action: 'submit'}).then(function(token) {
          aista_invoke_prompt(msg, token);
        });
      });
    } else {
      aista_invoke_prompt(msg, null);
    }
  });
}

/*
 * Shows chat window.
 */
function aista_show_chat_window() {
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

/*
 * Function that invokes our backend with the prompt to retrieve completion.
 */
function aista_invoke_prompt(msg, token) {

  // Creating our URL.
  let url = '[[url]]/magic/system/openai/prompt?prompt=' + encodeURIComponent(msg) + '&type=[[type]]';
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

      // Appending answer to message container
      const row = window.document.createElement('div');
      if (aistaChatChat) {
        if (aistaChatMarkdown) {
          var converter = new showdown.Converter();
          row.innerHTML = converter.makeHtml(data.result);
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
    })
    .catch(error => {

      // Enabling input textbox such that user can ask next question
      const inp = window.document.getElementsByClassName('aista-chat-prompt')[0];
      inp.disabled = false;
      inp.focus();
      inp.select();

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
