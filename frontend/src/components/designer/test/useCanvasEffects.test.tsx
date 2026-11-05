// @vitest-environment jsdom
/*
 * What keeps the canvas document in step outside any one edit: the designer's override sheet,
 * the author's stylesheet taken over by an injected block, hidden elements forced into view
 * (and un-forced), the drop footprint on empty containers, and the set of hidden elements.
 * The test page's own document stands in for the canvas, since it has a window to measure with.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useCanvasEffects } from '../hooks/useCanvasEffects';
import { useDocumentState } from '../hooks/useDocumentState';
import { useStylesheetState } from '../hooks/useStylesheetState';

beforeEach(() => {
  document.head.innerHTML =
    '<link rel="stylesheet" href="/site.css"><style data-magic-overrides></style>';
  document.body.innerHTML =
    '<div id="gone" style="display:none">x</div><div id="empty"></div><p id="full">text</p><img id="img">';
});

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

function setup(reveal = false) {
  return renderHook(
    ({ show }: { show: boolean }) => {
      const documentState = useDocumentState();
      const stylesheet = useStylesheetState();
      const hidden = useCanvasEffects({ reveal: show, documentState, stylesheet });
      return { documentState, stylesheet, hidden };
    },
    { initialProps: { show: reveal } },
  );
}

function attach(rig: ReturnType<typeof setup>) {
  rig.result.current.documentState.docRef.current = document;
  act(() => rig.result.current.documentState.setDoc(document));
  // A new document loading is what re-runs the reveal and empty-container effects.
  act(() => rig.result.current.documentState.setSrcDoc('<p>loaded</p>'));
}

const by = (id: string) => document.querySelector<HTMLElement>('#' + id)!;

describe('useCanvasEffects style sheets', () => {
  it('mirrors the overrides into the designer sheet', () => {
    const rig = setup();
    attach(rig);
    act(() => rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } }));
    expect(document.querySelector('style[data-magic-overrides]')!.textContent).toBe(
      'p {\n  color: red;\n}',
    );
    act(() => rig.result.current.stylesheet.setOverrides({}));
    expect(document.querySelector('style[data-magic-overrides]')!.textContent).toBe('');
  });

  it('switches the author link off and carries the author css in its place', () => {
    const rig = setup();
    attach(rig);
    act(() => {
      rig.result.current.stylesheet.setCssPath('/etc/www/site.css');
      rig.result.current.stylesheet.setCssHead('p { margin: 0; }');
      rig.result.current.stylesheet.setCssTail('b { color: red; }');
    });
    const link = document.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
    expect(link.dataset.magicDisabled).toBe('');
    expect(link.disabled).toBe(true);
    const author = link.nextElementSibling as HTMLElement;
    expect(author.tagName).toBe('STYLE');
    expect(author.textContent).toContain('p { margin: 0; }');
    expect(author.textContent).toContain('b { color: red; }');
  });

  it('leaves the document alone with no stylesheet path', () => {
    const rig = setup();
    attach(rig);
    expect(
      (document.querySelector('link') as HTMLLinkElement).dataset.magicDisabled,
    ).toBeUndefined();
  });
});

describe('useCanvasEffects reveal and hidden', () => {
  it('forces hidden elements into view only while reveal is on', () => {
    const rig = setup(true);
    attach(rig);
    expect(by('gone').dataset.magicForce).toBe('');
    expect(by('full').dataset.magicForce).toBeUndefined();
    rig.rerender({ show: false });
    expect(by('gone').dataset.magicForce).toBeUndefined();
  });

  it('reports the hidden elements, forced or not', () => {
    const rig = setup(false);
    attach(rig);
    expect(Array.from(rig.result.current.hidden)).toEqual([by('gone')]);
    rig.rerender({ show: true });
    expect(rig.result.current.hidden.has(by('gone'))).toBe(true);
    expect(rig.result.current.hidden.has(by('full'))).toBe(false);
  });

  it('reports nothing before a document has loaded', () => {
    const rig = setup();
    expect(rig.result.current.hidden.size).toBe(0);
  });

  it('bumps the version when reveal changes', () => {
    const rig = setup(false);
    attach(rig);
    const before = rig.result.current.documentState.version;
    rig.rerender({ show: true });
    expect(rig.result.current.documentState.version).toBeGreaterThan(before);
  });
});

describe('useCanvasEffects empty containers', () => {
  it('marks containers with nothing designable inside and not void or full ones', () => {
    const rig = setup();
    attach(rig);
    expect(by('empty').dataset.magicEmpty).toBe('');
    expect(by('full').dataset.magicEmpty).toBeUndefined();
    expect(by('img').dataset.magicEmpty).toBeUndefined();
  });

  it('un-marks a container once it holds something', () => {
    const rig = setup();
    attach(rig);
    by('empty').append(document.createElement('span'));
    act(() => rig.result.current.documentState.setVersion(value => value + 1));
    expect(by('empty').dataset.magicEmpty).toBeUndefined();
    expect(by('empty').firstElementChild!.hasAttribute('data-magic-empty')).toBe(true);
  });
});
