
/*
 * Default JavaScript file for OpenAI search embed.
 */
(function() {

fetch('https://docs.aista.com/assets/css/icofont.min.css')
  .then(res => {
    return res.text()
  })
  .then(res => {

    // Injecting CSS into DOM.
    var css = document.createElement('style');
    css.innerHTML = res;
    window.document.getElementsByTagName('head')[0].appendChild(css);
});


// Retrieving reCAPTCHA site key.
let aistaReCaptchaSiteKeySearch = '[[recaptcha]]';
if (aistaReCaptchaSiteKeySearch && aistaReCaptchaSiteKeySearch.length > 0) {

  // Including reCAPTCHA version 3
  const cap = window.document.createElement('script');
  cap.src = 'https://www.google.com/recaptcha/api.js?render=' + aistaReCaptchaSiteKeySearch;
  window.document.getElementsByTagName('head')[0].appendChild(cap);
}


// Creating CSS inclusion.
fetch('[[url]]/magic/system/openai/include-style-search?file=' + encodeURIComponent('[[css]]'))
  .then(res => {
    return res.text()
  })
  .then(res => {

    // Injecting CSS into DOM.
    var css = document.createElement('style');
    css.innerHTML = res;
    window.document.getElementsByTagName('head')[0].appendChild(css);

    // Creating our chat UI.
    aista_create_search_ui();
  });

/*
 * Function creating our chat UI.
 */
function aista_create_search_ui() {
  const aistaChatBtn = window.document.createElement('button');
  let btnTxt = '[[button]]';
  if (btnTxt === '') {
    btnTxt = '<i class="icofont-search-1"></i>';
  }
  aistaChatBtn.innerHTML = btnTxt;
  aistaChatBtn.className = 'aista-search-btn';
  aistaChatBtn.addEventListener('click', () => aista_show_search_overlay());
  window.document.body.appendChild(aistaChatBtn);
}

function aista_show_search_overlay() {

  // Overlay.
  const aistaSearchOverlay = window.document.createElement('div');
  aistaSearchOverlay.className = 'aista-search-overlay';

  // Close button.
  const aistaSearchClose = window.document.createElement('button');
  aistaSearchClose.innerHTML = 'X';
  aistaSearchClose.addEventListener('click', () => aistaSearchOverlay.parentNode.removeChild(aistaSearchOverlay));
  aistaSearchClose.className = 'aista-search-close';

  // Search wrapper.
  const aistaSearchWrp = window.document.createElement('div');
  aistaSearchWrp.className = 'aista-search-wrapper';

  // Search form.
  const aistaSearchForm = window.document.createElement('form');
  aistaSearchForm.className = 'aista-search-form';

  // Search textbox.
  const aistaSearchInput = window.document.createElement('input');
  aistaSearchInput.id = 'aistaSearchInput';
  aistaSearchInput.type = 'text';
  aistaSearchInput.placeholder = '[[placeholder]]';
  aistaSearchInput.className = 'aista-search-input';
  aistaSearchInput.autocomplete = 'off';
  setTimeout(() => {
    aistaSearchInput.focus();
  }, 500);
  aistaSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      aistaSearchOverlay.parentNode.removeChild(aistaSearchOverlay)
    }
  });
  aistaSearchForm.appendChild(aistaSearchInput);

  // Handling form submit.
  aistaSearchForm.addEventListener('submit', (e) => {
    aista_search(aistaSearchInput.value);
    e.preventDefault();
    return false;
  });

  // Search button.
  const aistaSearchBtn = window.document.createElement('button');
  aistaSearchBtn.type = 'submit';
  aistaSearchBtn.id = 'aistaSearchBtn';
  aistaSearchBtn.className = 'aista-search-search-btn';
  aistaSearchBtn.innerHTML = '<i class="icofont-search-1"></i>';
  aistaSearchForm.appendChild(aistaSearchBtn);

  // Search result wrapper.
  const aistaSearchResultWrp = window.document.createElement('div');
  aistaSearchResultWrp.id = 'aista-search-result-wrp';
  aistaSearchResultWrp.className = 'aista-search-result-wrp';

  // Appending elements into DOM.
  aistaSearchWrp.appendChild(aistaSearchForm);
  aistaSearchWrp.appendChild(aistaSearchResultWrp);
  aistaSearchOverlay.appendChild(aistaSearchWrp);
  aistaSearchOverlay.appendChild(aistaSearchClose);
  window.document.body.appendChild(aistaSearchOverlay);
}

function aista_search(prompt) {
  if (prompt === '') {
    return;
  }
  document.getElementById('aistaSearchInput').disabled = true;
  document.getElementById('aistaSearchBtn').disabled = true;
  if (aistaReCaptchaSiteKeySearch) {
    grecaptcha.ready(function() {
      grecaptcha.execute(aistaReCaptchaSiteKeySearch, {action: 'submit'}).then(function(token) {
        aista_invoke_search(prompt, token);
      });
    });
  } else {
    aista_invoke_search(prompt);
  }
}

/*
 * Function that invokes our backend with the prompt to retrieve completion.
 */
function aista_invoke_search(msg, token) {

  // Creating our URL.
  let url = `[[url]]/magic/system/openai/search?prompt=` + encodeURIComponent(msg) + '&type=[[type]]&max=[[max]]';
  if (token) {
    url += '&recaptcha_response=' + encodeURIComponent(token);
  }

  // Invoking backend, with reCAPTCHA response if we've got a site-key
  fetch(url, {
    method: 'GET',
  })
    .then(res => {

      // Enabling stuff again.
      const inp = document.getElementById('aistaSearchInput');
      inp.disabled = false;
      inp.select();
      inp.focus();
      document.getElementById('aistaSearchBtn').disabled = false;

      // Sanity checking result.
      if (res.status >= 200 && res.status <= 299) {
        return res.json();
      } else if (res.status === 499) {
        throw Error('Access denied, missing reCAPTCHA. Either configure your model to not use reCAPTCHA, or setup reCAPTCHA for your bot');
      } else if (res.status === 401) {
        throw Error('Your model requires authentication, and you are not authorised to invoking it. Either turn off all roles, or add JWT token to requests somehow.');
      } else if (res.status === 429) {
        throw Error('Seriously, it is not us! OpenAI is overloaded.');
      } else {
        throw Error(res.statusText);
      }
    })
    .then(data => {

      const aistaSearchResultWrp = document.getElementById('aista-search-result-wrp')
      aistaSearchResultWrp.innerHTML = '';

      if (data.snippets && data.snippets.length > 0) {
        const list = window.document.createElement('ul');
        for (const idx of data.snippets) {
          const idxLi = window.document.createElement('li');
          const idxLnk = window.document.createElement('a');
          idxLnk.innerHTML = idx.prompt;
          idxLnk.target = '_blank';
          idxLnk.href = idx.uri;
          idxLi.appendChild(idxLnk);
          list.appendChild(idxLi);
        }
        aistaSearchResultWrp.appendChild(list);
      }
    })
    .catch(error => {

      console.log(error);
    });
}})();
