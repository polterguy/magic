// @vitest-environment jsdom
/*
 * The AI support chatbot loader: the script tag it appends (themed by the dashboard theme), the
 * cached load, retry after a failed load, and the three entry points. jsdom never fetches the
 * script, so the tests fire its load and error events themselves.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Toast } from '../toast';

type Support = typeof import('../support');
type ToastModule = typeof import('../toast');

let support: Support;
let toast: ToastModule;
let toasts: Toast[];

function scripts() {
  return document.querySelectorAll<HTMLScriptElement>('script#ainiro-support-chatbot');
}

// The widget script, once loaded, hangs these off window.
function installWidget() {
  const widget = { show: vi.fn() };
  globalThis.ainiro = widget;
  globalThis.ainiro_faq_question = vi.fn();
  return widget;
}

beforeEach(async () => {
  // The loader caches its promise at module level, so every test gets a fresh module.
  vi.resetModules();
  support = await import('../support');
  toast = await import('../toast');
  toasts = [];
  toast.setToastListener(t => toasts.push(t));
  localStorage.clear();
  document.body.innerHTML = '';
});

afterEach(() => {
  toast.setToastListener(null);
  globalThis.ainiro = undefined;
  globalThis.ainiro_faq_question = undefined;
});

describe('openSupport', () => {
  it('shows the widget straight away when it is already on the page', async () => {
    const widget = installWidget();
    await support.openSupport();
    expect(widget.show).toHaveBeenCalledTimes(1);
    expect(scripts()).toHaveLength(0);
  });

  it('appends the script once, then shows the widget when it has loaded', async () => {
    const pending = support.openSupport();
    const second = support.openSupport();
    expect(scripts()).toHaveLength(1);
    const script = scripts()[0];
    expect(script.async).toBe(true);
    expect(script.src).toContain('https://ainiro.io/magic/system/openai/include-chatbot.js?');
    expect(script.src).toContain('type=magic-documentation');
    expect(script.src).toContain('hidden=true');
    const widget = installWidget();
    script.dispatchEvent(new Event('load'));
    await Promise.all([pending, second]);
    expect(widget.show).toHaveBeenCalledTimes(2);
  });

  it('paints the widget light by default', () => {
    void support.openSupport();
    const src = scripts()[0].src;
    expect(src).toContain('&color=%231c1917&start=%23ffffff');
    expect(src).toContain('&v=lgtthm1');
  });

  it('paints the widget dark when the dashboard theme is dark', () => {
    localStorage.setItem('magic2.theme', 'dark');
    void support.openSupport();
    const src = scripts()[0].src;
    expect(src).toContain('&color=%23f5f5f4&start=%233a322c');
    expect(src).toContain('&v=drkthm5');
  });

  it('toasts an error and removes the tag when the script fails to load', async () => {
    const pending = support.openSupport();
    scripts()[0].dispatchEvent(new Event('error'));
    await pending;
    expect(toasts).toEqual([
      expect.objectContaining({ text: 'Could not reach the support chatbot', isError: true }),
    ]);
    expect(scripts()).toHaveLength(0);
  });

  it('tries again after a failed load', async () => {
    const failed = support.openSupport();
    scripts()[0].dispatchEvent(new Event('error'));
    await failed;
    const retry = support.openSupport();
    expect(scripts()).toHaveLength(1);
    const widget = installWidget();
    scripts()[0].dispatchEvent(new Event('load'));
    await retry;
    expect(widget.show).toHaveBeenCalledTimes(1);
  });

  it('does not fail when the script loaded but defined no widget', async () => {
    const pending = support.openSupport();
    scripts()[0].dispatchEvent(new Event('load'));
    await pending;
    expect(toasts).toEqual([]);
  });
});

describe('askSupport', () => {
  it('puts the question to the loaded widget', async () => {
    installWidget();
    await support.askSupport('How do I log in?');
    expect(globalThis.ainiro_faq_question).toHaveBeenCalledWith(null, 'How do I log in?');
  });

  it('loads the widget first when needed', async () => {
    const pending = support.askSupport('Hi');
    installWidget();
    scripts()[0].dispatchEvent(new Event('load'));
    await pending;
    expect(globalThis.ainiro_faq_question).toHaveBeenCalledWith(null, 'Hi');
  });

  it('toasts when the widget cannot be loaded', async () => {
    const pending = support.askSupport('Hi');
    scripts()[0].dispatchEvent(new Event('error'));
    await pending;
    expect(toasts[0]).toMatchObject({ text: 'Could not reach the support chatbot', isError: true });
  });

  it('asks nothing when the script loaded without the alias', async () => {
    globalThis.ainiro = { show: vi.fn() };
    await support.askSupport('Hi');
    expect(toasts).toEqual([]);
  });
});

describe('explainHyperlambda', () => {
  it('asks for an explanation of the code, fenced as hyperlambda', async () => {
    installWidget();
    support.explainHyperlambda('log.info:x');
    await vi.waitFor(() => expect(globalThis.ainiro_faq_question).toHaveBeenCalled());
    expect(globalThis.ainiro_faq_question).toHaveBeenCalledWith(
      null,
      'Explain this code \n```hyperlambda\nlog.info:x\n```',
    );
  });

  it('does nothing for blank code', async () => {
    installWidget();
    support.explainHyperlambda('  \n ');
    await Promise.resolve();
    expect(globalThis.ainiro_faq_question).not.toHaveBeenCalled();
    expect(scripts()).toHaveLength(0);
  });
});
