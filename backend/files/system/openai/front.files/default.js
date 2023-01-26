(function() {

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
    const cap = document.createElement('script');
    cap.src = 'https://www.google.com/recaptcha/api.js?render=' + aistaReCaptchaSiteKey;
    document.getElementsByTagName('head')[0].appendChild(cap);
  }
});

  // Creating CSS inclusion.
var css = document.createElement('style');
css.innerHTML = `
.grecaptcha-badge {
  opacity:0;
}
@keyframes aista-chat-question-waiting {
  0% { margin-left:-10px; opacity: 0; color: rgb(128,128,0); }
  10% { margin-left:-10px; opacity: 0; color: rgb(128,128,0); }
  23% { margin-left:0px; opacity: 1; color: rgb(128,128,128); }
  50% { margin-left:0px; opacity: 1; color: rgb(128,128,128); }
  65% { margin-left:0px; opacity: 1; color: rgb(128,128,128); }
  100% { margin-left:-10px; opacity: 0; color: rgb(128,128,0); }
}
.aista-chat-question-waiting {
  animation-name: aista-chat-question-waiting;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  font-size: 14px;
  margin-bottom: 10px;
  font-weight: bold;
}
.aista-chat-question {
  font-size: 14px;
  margin-bottom: 10px;
  font-weight: bold;
}
.aista-chat-btn {
  position: fixed;
  bottom: 10px;
  right: 10px;
  border-radius: 8px;
  background-color: #0084ff;
  border: none;
  padding: 15px;
  font-size: 16px;
  z-index: 9999;
  color: #fff;
  cursor: pointer;
  box-shadow: 3px 3px 5px rgba(0,0,0,.5);
  border: solid 1px #0080eb;
  font-family: Helvetica;
  font-weight: normal;
  text-align: center;
  text-decoration: none !important;
}
.aista-chat-btn:hover {
  text-decoration: none !important;
}
.aista-chat-wnd {
  position: fixed;
  z-index: 10000;
  bottom: 10px;
  right: 10px;
  width: 350px;
  max-width: calc(100% - 20px);
  background-color: #fafafa;
  border-radius: 8px;
  border: solid 1px #999;
  box-shadow: 2px 2px 15px rgba(0,0,0,.8);
  display: none;
}
.aista-chat-header {
  font-size: 12px;
  margin: 18px 20px 15px 12px;
  color: rgb(128,128,128);
}
.aista-chat-close-btn {
  border-radius: 8px;
  background-color: #0084ff;
  border: none;
  padding: 8px 12px;
  font-size: 12px;
  color: #fff;
  position: absolute;
  top: 10px;
  right: 12px;
  cursor: pointer;
}
.aista-chat-msg-container {
  height: 300px;
  margin: 0 10px;
  background-color: rgb(240,240,255);
  border-radius: 5px;
  padding: 15px;
  border: solid 1px rgba(0,0,0,.2);
  overflow-y: auto;
  font-size: 12px;
}
.aista-chat-error {
  background-color: rgb(255,230,230);
  padding: 15px;
  margin-left: -15px;
  margin-right: -15px;
  margin-bottom: 20px;
}
.aista-chat-answer {
  margin-bottom: 20px;
}
.aista-chat-prompt {
  padding: 10px;
  border-radius: 8px;
  border: solid 1px rgba(0,0,0,.2);
  width: 100%;
}
.aista-chat-form {
  padding: 15px;
}
`;
document.getElementsByTagName('head')[0].appendChild(css);

// Chat button.
const aistaChatBtn = document.createElement('button');
aistaChatBtn.innerHTML = '[[button]]';
aistaChatBtn.className = 'aista-chat-btn';
aistaChatBtn.addEventListener('click', () => {
  const wnd = document.getElementsByClassName('aista-chat-wnd')[0];
  wnd.style.display = 'block';
  aistaChatBtn.style.display = 'none';
  const inp = document.getElementsByClassName('aista-chat-prompt')[0];
  inp.focus();
  inp.select();
});
document.body.appendChild(aistaChatBtn);

// Chat window.
const aistaChatWnd = document.createElement('div');
aistaChatWnd.className = 'aista-chat-wnd';
aistaChatWnd.innerHTML = `
<div class="aista-chat-header">[[header]]</div>
<div class="aista-chat-msg-container"></div>
<button class="aista-chat-close-btn">X</button>
<form class="aista-chat-form">
<input type="text" class="aista-chat-prompt">
</form>
`;
document.body.appendChild(aistaChatWnd);

// Add an event listener to the close button
document.getElementsByClassName('aista-chat-close-btn')[0].addEventListener('click', () => {
  aistaChatWnd.style.display = 'none';
  aistaChatBtn.style.display = 'block';
});

// Add a submit event handler to the form
document.getElementsByClassName('aista-chat-form')[0].addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = document.getElementsByClassName('aista-chat-prompt')[0];
  const msg = inp.value;
  const msgEl = document.createElement('div');
  msgEl.innerText = msg;
  msgEl.className = 'aista-chat-question-waiting';
  const msgs = document.getElementsByClassName('aista-chat-msg-container')[0];
  msgs.appendChild(msgEl);
  msgEl.scrollIntoView({behavior: 'smooth'});
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

// Function that invokes our backend with the prompt to retrieve completion.
function aista_invoke_prompt(msg, token) {

  // Creating our URL
  let url = '[[url]]/magic/system/openai/prompt?prompt=' + encodeURIComponent(msg) + '&type=[[type]]';
  if (token) {
    url += '&recaptcha_response=' + encodeURIComponent(token);
  }

  // Invoking backend, with reCAPTCHA response if we've got a site-key
  fetch(url, {
    method: 'GET',
  })
    .then(res => {
      if (res.status >= 200 && res.status <= 299) {
        return res.json();
      } else {
        throw Error(res.statusText);
      }
    })
  	.then(data => {

      // Enabling input textbox such that user can ask next question
      const inp = document.getElementsByClassName('aista-chat-prompt')[0];
      inp.disabled = false;
      inp.focus();
      inp.select();

      // Appending answer to message container
      const row = document.createElement('div');
      row.innerText = data.result;
      row.className = 'aista-chat-answer';
      const msgs = document.getElementsByClassName('aista-chat-msg-container')[0];
      msgs.appendChild(row);

      // Removing flashing on question
      const msgRow = document.getElementsByClassName('aista-chat-question-waiting')[0];
      msgRow.className = 'aista-chat-question';
      msgRow.scrollIntoView({behavior: 'smooth'});
    })
    .catch(error => {

      // Enabling input textbox such that user can ask next question
      const inp = document.getElementsByClassName('aista-chat-prompt')[0];
      inp.disabled = false;
      inp.focus();
      inp.select();

      // Appending answer to message container
      const row = document.createElement('div');
      row.className = 'aista-chat-error';
      const msg = error.message === 'Too Many Requests' ? 'OpenAI is overloaded, try again later' : error.message;
      row.innerText = msg;
      const msgs = document.getElementsByClassName('aista-chat-msg-container')[0];
      msgs.appendChild(row);

      // Removing flashing on question
      const msgRow = document.getElementsByClassName('aista-chat-question-waiting')[0];
      msgRow.className = 'aista-chat-question';
      msgRow.scrollIntoView({behavior: 'smooth'});
    });
}})();
