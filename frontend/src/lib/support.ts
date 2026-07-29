/*
 * The AI support chatbot — AINIRO's Hyperlambda and Magic documentation bot,
 * not the cloudlet's own. It is a script hosted on ainiro.io that builds a
 * widget and hangs [ainiro] off window.
 *
 * Loaded on first use rather than on every page, so the dashboard's initial
 * load never waits on a third party, and a user who never asks for support
 * never fetches it at all.
 */

import { showToast } from './toast';

const SCRIPT_ID = 'ainiro-support-chatbot';

/*
 * Included with hidden=true, so nothing renders until show() is called - the
 * dashboard has its own button for that. The rest is presentation, and [v] is
 * a manual cache-buster for when the widget itself changes.
 */
const SCRIPT_SRC =
  'https://ainiro.io/magic/system/openai/include-chatbot.js' +
  '?type=magic-documentation' +
  '&header=Ask%20about%20Hyperlambda%20or%20Magic' +
  '&placeholder=Ask%20me%20about%20Hyperlambda%20...' +
  '&button=AI%20Chatbot' +
  '&theme=modern-square' +
  '&position=right' +
  '&follow_up=true' +
  '&code=true' +
  '&new_tab=true' +
  '&references=false' +
  '&rtl=false' +
  '&clear_button=false' +
  '&copyButton=false' +
  '&popup=' +
  /*
   * Frank wears the LIGHTER part of the dashboard's "This cloudlet is an AI
   * agent" card — the warm surface (#1a1410) lifted by its white sheen
   * (rgba(255,255,255,.10) ≈ #322b27). The widget paints that as a gradient, so
   * Frank does too: [start]→[end] runs from the lit warm tone down to a slightly
   * calmer warm brown, keeping the panel in the card's lighter register. Warm-
   * white text and a white accent. No violet, no blue.
   *
   * [color] is the body text, [start] the panel/bubble surface (gradient top),
   * [end] tints the whole panel (gradient bottom), [link] the accent.
   */
  '&color=%23f5f5f4' +
  '&start=%233a322c' +
  '&end=%23262019' +
  '&link=%23f5f5f4' +
  '&hidden=true' +
  '&v=drkthm5';

let loading: Promise<void> | null = null;

/*
 * Resolves once the widget is on the page. The script guards itself against
 * double inclusion, but the promise is cached anyway so two quick clicks
 * don't append two tags.
 */
function load(): Promise<void> {
  if ((window as any).ainiro) {
    return Promise.resolve();
  }
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later attempt try again, in case the network was the problem.
      loading = null;
      script.remove();
      reject(new Error('Could not load the support chatbot'));
    };
    document.body.appendChild(script);
  });
  return loading;
}

// Opens the chatbot, loading it first if this is the first time.
export async function openSupport() {
  try {
    await load();
    (window as any).ainiro?.show();
  } catch {
    showToast('Could not reach the support chatbot', true);
  }
}

/*
 * Puts a question to the chatbot directly. [ainiro_faq_question] is the
 * widget's own alias for its ask() method, and it opens the panel itself.
 */
export async function askSupport(question: string) {
  try {
    await load();
    (window as any).ainiro_faq_question?.(null, question);
  } catch {
    showToast('Could not reach the support chatbot', true);
  }
}

/*
 * Asks the bot to explain a piece of Hyperlambda. Fenced as hyperlambda so
 * the bot knows what it is looking at, the way the old dashboard's F1 did.
 */
export function explainHyperlambda(code: string) {
  if (code.trim() === '') {
    return;
  }
  askSupport('Explain this code \n```hyperlambda\n' + code + '\n```');
}
