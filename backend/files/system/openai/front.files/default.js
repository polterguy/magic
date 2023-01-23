
// Creating CSS
var css = document.createElement('style');
css.type = 'text/css';
css.innerHTML = `
@keyframes chatGptWaiting {
  0% { margin-left:-10px; opacity: 0; color: rgb(128,128,0); }
  10% { margin-left:-10px; opacity: 0; color: rgb(128,128,0); }
  23% { margin-left:0px; opacity: 1; color: rgb(128,128,128); }
  50% { margin-left:0px; opacity: 1; color: rgb(128,128,128); }
  65% { margin-left:0px; opacity: 1; color: rgb(128,128,128); }
  100% { margin-left:-10px; opacity: 0; color: rgb(128,128,0); }
}
.chatGptWaiting {
   animation-name: chatGptWaiting;
   animation-duration: 1s;
   animation-iteration-count: infinite;
   animation-direction: alternate;
}
`;
document.getElementsByTagName('head')[0].appendChild(css);

// Create a chat button
const cb = document.createElement('button');
cb.innerHTML = 'Chat with the Machine';
cb.style.position = 'fixed';
cb.style.bottom = '5px';
cb.style.right = '5px';
cb.style.borderRadius = '8px';
cb.style.backgroundColor = '#0084ff';
cb.style.border = 'none';
cb.style.padding = '15px';
cb.style.fontSize = '16px';
cb.style.zIndex = '9999';
cb.style.color = '#fff';
document.body.appendChild(cb);

// Create a dialogue window
const wnd = document.createElement('div');
wnd.style.position = 'fixed';
wnd.style.zIndex = '10000';
wnd.style.bottom = '10px';
wnd.style.right = '10px';
wnd.style.width = '350px';
wnd.style.maxWidth = '100%';
wnd.style.backgroundColor = '#fafafa';
wnd.style.borderRadius = '8px';
wnd.style.border = 'solid 1px #999';
wnd.style.boxShadow = '2px 2px 15px rgba(0,0,0,.8)';
wnd.style.display = 'none';

const header = document.createElement('div');
header.innerHTML = '[[header]]';
header.style.fontSize = '12px';
header.style.margin = '18px 20px 15px 12px';
header.style.color = 'rgb(128,128,128)';
wnd.appendChild(header);

const close = document.createElement('button');
close.innerHTML = 'X';
close.style.borderRadius = '8px';
close.style.backgroundColor = '#0084ff';
close.style.border = 'none';
close.style.padding = '8px 12px';
close.style.fontSize = '12px';
close.style.color = '#fff';
close.style.position = 'absolute';
close.style.top = '10px';
close.style.right = '12px';
wnd.appendChild(close);

// Messages container
const msgs = document.createElement('div');
msgs.style.height = '300px';
msgs.style.margin = '0 10px';
msgs.style.backgroundColor = 'rgb(240,240,255)';
msgs.style.borderRadius = '5px';
msgs.style.padding = '15px';
msgs.style.fontSize = '12px';
msgs.style.border = 'solid 1px rgba(0,0,0,.2)';
msgs.style.overflowY = 'auto';
wnd.appendChild(msgs);

// Form allowing user to submit chat message
const frm = document.createElement('form');
frm.style.padding = '15px';

const inp = document.createElement('input');
inp.type = 'text';
inp.placeholder = 'Your question ...';
inp.style.padding = '10px';
inp.style.borderRadius = '8px';
inp.style.border = 'solid 1px rgba(0,0,0,.2)';
inp.style.width = '100%';
inp.style.boxSizing = 'border-box';
frm.appendChild(inp);
wnd.appendChild(frm);

// Append the dialogue window to the DOM
document.body.appendChild(wnd);

// Add an event listener to the chat button
cb.addEventListener('click', () => {
  wnd.style.display = 'block';
  cb.style.display = 'none';
  inp.focus();
  inp.select();
});

// Add an event listener to the close button
close.addEventListener('click', () => {
  wnd.style.display = 'none';
  cb.style.display = 'block';
  setTimeout(() => {
    inp.focus();
    inp.select();
  }, 250);
});

// Add a submit event handler to the dialogue window
wnd.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = inp.value;
  const msgRow = document.createElement('div');
  msgRow.style.fontSize = '14px';
  msgRow.style.marginBottom = '10px';
  msgRow.style.fontWeight = 'bold';
  msgRow.innerText = msg;
  msgRow.className = 'chatGptWaiting';
  msgs.appendChild(msgRow);
  msgRow.scrollIntoView({behavior: 'smooth'});
  inp.disabled = true;
  
  // Invoking backend
  fetch('[[url]]/magic/system/openai/prompt?prompt=' + encodeURIComponent(msg) + '&type=[[type]]', {
    method: 'GET',
  }).then(res => res.json())
  	.then(data => {
      inp.disabled = false;
      inp.focus();
      inp.select();
      const row = document.createElement('div');
      row.style.marginBottom = '20px';
      row.innerText = data.result;
      msgs.appendChild(row);
      msgRow.className = '';
      msgRow.scrollIntoView({behavior: 'smooth'});
  });
});
