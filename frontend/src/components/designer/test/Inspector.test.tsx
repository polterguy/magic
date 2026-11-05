// @vitest-environment jsdom
/*
 * Inspector, the generic fields: the empty state, breadcrumbs, the action buttons, a selected
 * run of text (and the element around it), the tag field and its validation, the id, the
 * classes and their suggestions, the media preview and the attribute list.
 */
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { attributeInput, makeDoc, renderInspector } from './inspectorHarness';

describe('Inspector empty state', () => {
  it('asks for a selection when there is no node', () => {
    renderInspector('<p>x</p>', () => null);
    expect(screen.getByText(/Select something on the canvas/)).toBeInTheDocument();
  });

  it('asks for a selection when there is no document', () => {
    renderInspector('<p>x</p>', 'p', { doc: null });
    expect(screen.getByText(/Select something on the canvas/)).toBeInTheDocument();
  });
});

describe('Inspector breadcrumbs', () => {
  it('lists the ancestors and selects one on click', async () => {
    const { s, doc } = renderInspector(
      '<main id="root"><section class="hero big"><h1>Hi</h1></section></main>',
      'h1',
    );
    const crumbs = document.querySelector('.designer-crumbs') as HTMLElement;
    const buttons = within(crumbs).getAllByRole('button');
    expect(buttons.map(button => button.textContent)).toEqual([
      'html',
      'body',
      'main#root',
      'section.hero',
    ]);
    expect(crumbs.querySelector('.current')).toHaveTextContent('h1');
    await userEvent.click(screen.getByTitle('Select this section.hero'));
    expect(s.onSelect).toHaveBeenCalledWith(doc!.querySelector('section'));
  });

  it('leaves the typing wrapper out of the ancestors', () => {
    const doc = makeDoc('<h1><span data-magic-editing="">Words</span></h1>');
    const text = doc.querySelector('span')!.firstChild;
    renderInspector('', () => text, { doc });
    const crumbs = document.querySelector('.designer-crumbs') as HTMLElement;
    const names = within(crumbs)
      .getAllByRole('button')
      .map(button => button.textContent);
    expect(names).toEqual(['html', 'body', 'h1']);
    expect(crumbs.querySelector('.current')).toHaveTextContent('"Words"');
  });

  it('shows only the current node for the body', () => {
    renderInspector('<p>x</p>', doc => doc.body);
    const crumbs = document.querySelector('.designer-crumbs') as HTMLElement;
    expect(within(crumbs).getAllByRole('button')).toHaveLength(1);
    expect(crumbs.querySelector('.current')).toHaveTextContent('body');
  });
});

describe('Inspector actions', () => {
  it('fires every action callback for an element', async () => {
    const { s } = renderInspector('<div><p>x</p></div>', 'p');
    await userEvent.click(screen.getByRole('button', { name: 'Up' }));
    await userEvent.click(screen.getByRole('button', { name: 'Down' }));
    await userEvent.click(screen.getByRole('button', { name: /Duplicate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Wrap' }));
    await userEvent.click(screen.getByRole('button', { name: 'Unwrap' }));
    await userEvent.click(screen.getByRole('button', { name: /Delete/ }));
    expect(s.onMove.mock.calls).toEqual([[-1], [1]]);
    expect(s.onDuplicate).toHaveBeenCalledTimes(1);
    expect(s.onWrap).toHaveBeenCalledTimes(1);
    expect(s.onUnwrap).toHaveBeenCalledTimes(1);
    expect(s.onDelete).toHaveBeenCalledTimes(1);
  });

  it('offers Add #text only when asked to and fires its callback', async () => {
    const first = renderInspector('<div></div>', 'div');
    expect(screen.queryByRole('button', { name: 'Add #text' })).not.toBeInTheDocument();
    first.unmount();
    const { s } = renderInspector('<div></div>', 'div', { canAddText: true });
    await userEvent.click(screen.getByRole('button', { name: 'Add #text' }));
    expect(s.onAddText).toHaveBeenCalledTimes(1);
  });

  it('has no Unwrap for a run of text', () => {
    renderInspector('<p>hello</p>', doc => doc.querySelector('p')!.firstChild);
    expect(screen.queryByRole('button', { name: 'Unwrap' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wrap' })).toBeInTheDocument();
  });
});

describe('Inspector text runs', () => {
  const pickText = (doc: Document) => doc.querySelector('p')!.firstChild;

  it('shows the trimmed words and the element around them', () => {
    renderInspector('<p class="lead">  hello world  </p>', pickText);
    expect(screen.getByLabelText('#text')).toHaveValue('hello world');
    expect(screen.getByLabelText('Tag')).toHaveValue('p');
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });

  it('selects the parent from the Inside button', async () => {
    const { s, doc } = renderInspector('<p>hello</p>', pickText);
    await userEvent.click(screen.getByTitle('Select it, so the buttons above act on it'));
    expect(s.onSelect).toHaveBeenCalledWith(doc!.querySelector('p'));
  });

  it('keeps a trailing space while typing and reads the node again on blur', async () => {
    const { s, node } = renderInspector('<p>hello</p>', pickText, { live: true });
    const box = screen.getByLabelText('#text');
    await userEvent.clear(box);
    await userEvent.type(box, 'two words ');
    expect(box).toHaveValue('two words ');
    expect(s.onSetText).toHaveBeenLastCalledWith('two words ');
    fireEvent.blur(box);
    expect(box).toHaveValue('two words');
    expect((node as Text).data).toBe('two words ');
  });

  it('shows the placeholder for an empty run', () => {
    renderInspector('<p> </p>', pickText);
    const box = screen.getByLabelText('#text');
    expect(box).toHaveValue('');
    expect(box).toHaveAttribute('placeholder', 'Empty');
  });

  it('edits the attributes of the parent from a text selection', () => {
    const { s } = renderInspector(
      '<a href="/x">link</a>',
      doc => doc.querySelector('a')!.firstChild,
    );
    fireEvent.change(attributeInput(document.body, 'href'), { target: { value: '/y' } });
    expect(s.onSetAttribute).toHaveBeenCalledWith('href', '/y');
  });

  it('copes with a run that has no parent element', () => {
    const doc = makeDoc('');
    const fragment = doc.createDocumentFragment();
    const text = doc.createTextNode('orphan');
    fragment.append(text);
    renderInspector('', () => text, { doc });
    expect(screen.getByLabelText('#text')).toHaveValue('orphan');
    expect(screen.queryByText('Inside')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tag')).not.toBeInTheDocument();
  });
});

describe('Inspector tag field', () => {
  it('shows the tag and offers the common ones', () => {
    renderInspector('<h2>x</h2>', 'h2');
    expect(screen.getByLabelText('Tag')).toHaveValue('h2');
    const options = Array.from(document.querySelectorAll('#designer-tags option'));
    expect(options.map(option => option.getAttribute('value'))).toContain('section');
  });

  it('changes the tag on Enter, trimming and lowercasing what was typed', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const field = screen.getByLabelText('Tag');
    await userEvent.clear(field);
    await userEvent.type(field, ' Section {Enter}');
    expect(s.onChangeTag).toHaveBeenCalledTimes(1);
    expect(s.onChangeTag).toHaveBeenCalledWith('section');
    expect(field).not.toHaveClass('invalid');
  });

  it('changes the tag when the field loses focus', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const field = screen.getByLabelText('Tag');
    await userEvent.clear(field);
    await userEvent.type(field, 'my-widget');
    expect(s.onChangeTag).not.toHaveBeenCalled();
    fireEvent.blur(field);
    expect(s.onChangeTag).toHaveBeenCalledWith('my-widget');
  });

  it('does nothing when the typed tag is the current one', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const field = screen.getByLabelText('Tag');
    await userEvent.clear(field);
    await userEvent.type(field, 'DIV');
    fireEvent.blur(field);
    expect(s.onChangeTag).not.toHaveBeenCalled();
    expect(field).toHaveValue('div');
  });

  it('does nothing on blur when nothing was typed', () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    fireEvent.blur(screen.getByLabelText('Tag'));
    expect(s.onChangeTag).not.toHaveBeenCalled();
  });

  it.each(['9lives', 'a b', 'body', 'html', 'head', ''])(
    'marks %j as invalid and keeps what was typed',
    async bad => {
      const { s } = renderInspector('<div>x</div>', 'div');
      const field = screen.getByLabelText('Tag');
      await userEvent.clear(field);
      if (bad) {
        await userEvent.type(field, bad);
      }
      fireEvent.keyDown(field, { key: 'Enter' });
      expect(field).toHaveClass('invalid');
      expect(field).toHaveValue(bad);
      expect(s.onChangeTag).not.toHaveBeenCalled();
    },
  );

  it('clears the invalid mark when typing again', async () => {
    renderInspector('<div>x</div>', 'div');
    const field = screen.getByLabelText('Tag');
    await userEvent.clear(field);
    await userEvent.type(field, 'a b');
    fireEvent.blur(field);
    expect(field).toHaveClass('invalid');
    await userEvent.type(field, 'c');
    expect(field).not.toHaveClass('invalid');
  });

  it('ignores other keys', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const field = screen.getByLabelText('Tag');
    await userEvent.type(field, 'x');
    fireEvent.keyDown(field, { key: 'a' });
    expect(s.onChangeTag).not.toHaveBeenCalled();
  });
});

describe('Inspector id', () => {
  it('shows the id and writes changes', () => {
    const { s } = renderInspector('<div id="main">x</div>', 'div');
    const field = screen.getByLabelText('Id');
    expect(field).toHaveValue('main');
    fireEvent.change(field, { target: { value: 'other' } });
    expect(s.onSetAttribute).toHaveBeenCalledWith('id', 'other');
  });

  it('shows the placeholder when there is none', () => {
    renderInspector('<div>x</div>', 'div');
    expect(screen.getByLabelText('Id')).toHaveAttribute('placeholder', 'None');
  });
});

describe('Inspector classes', () => {
  it('says there are none', () => {
    renderInspector('<div>x</div>', 'div');
    expect(screen.getByText('No classes')).toBeInTheDocument();
  });

  it('removes a class from its chip', async () => {
    const { s } = renderInspector('<div class="a  b c">x</div>', 'div');
    await userEvent.click(screen.getByTitle('Remove b'));
    expect(s.onSetClasses).toHaveBeenCalledWith(['a', 'c']);
  });

  it('adds a class on Enter, stripping a leading dot, and clears the box', async () => {
    const { s } = renderInspector('<div class="a">x</div>', 'div', { live: true });
    const box = screen.getByPlaceholderText('Add a class…');
    await userEvent.type(box, ' .btn {Enter}');
    expect(s.onSetClasses).toHaveBeenCalledWith(['a', 'btn']);
    expect(box).toHaveValue('');
    expect(screen.getByTitle('Remove btn')).toBeInTheDocument();
  });

  it('adds a class when the box loses focus', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const box = screen.getByPlaceholderText('Add a class…');
    await userEvent.type(box, 'card');
    fireEvent.blur(box);
    expect(s.onSetClasses).toHaveBeenCalledWith(['card']);
  });

  it('ignores an empty or duplicate class', async () => {
    const { s } = renderInspector('<div class="a">x</div>', 'div');
    const box = screen.getByPlaceholderText('Add a class…');
    fireEvent.blur(box);
    await userEvent.type(box, '.a{Enter}');
    await userEvent.type(box, '{Enter}');
    expect(s.onSetClasses).not.toHaveBeenCalled();
  });

  it('ignores other keys in the class box', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    await userEvent.type(screen.getByPlaceholderText('Add a class…'), 'q');
    expect(s.onSetClasses).not.toHaveBeenCalled();
  });

  it('suggests the classes the page wears, the ones for this tag first', () => {
    renderInspector(
      '<div class="zeta">x</div><a class="btn  link">y</a><p class="alpha"> </p><span class="  "></span><button class="btn">z</button>',
      'button',
    );
    const names = Array.from(document.querySelectorAll('#designer-classes option')).map(option =>
      option.getAttribute('value'),
    );
    expect(names).toEqual(['btn', 'alpha', 'link', 'zeta']);
  });
});

describe('Inspector media', () => {
  it.each([
    ['img', '<img src="/logo.png">', 'Image', 'Choose an image…', 'image'],
    ['video', '<video src="/clip.mp4"></video>', 'Video', 'Choose a video…', 'video'],
    [
      'audio',
      '<audio src="https://cdn.test/a.mp3"></audio>',
      'Audio',
      'Choose an audio file…',
      'audio',
    ],
  ] as const)('offers a %s picker', async (selector, markup, label, button, kind) => {
    const { s } = renderInspector(markup, selector);
    expect(screen.getByText(label)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: button }));
    await userEvent.click(screen.getByTitle(button.replace('…', '')));
    expect(s.onChooseMedia).toHaveBeenNthCalledWith(1, kind);
    expect(s.onChooseMedia).toHaveBeenNthCalledWith(2, kind);
  });

  it('previews a root-absolute image from the cloudlet origin', () => {
    renderInspector('<img src="/media/a.png">', 'img');
    const preview = document.querySelector('.designer-image-preview img');
    expect(preview).toHaveAttribute('src', 'https://cloudlet.test/media/a.png');
  });

  it('leaves a remote or relative source alone', () => {
    renderInspector('<img src="https://x.test/a.png">', 'img');
    expect(document.querySelector('.designer-image-preview img')).toHaveAttribute(
      'src',
      'https://x.test/a.png',
    );
  });

  it('previews a video and an audio file with their own elements', () => {
    const video = renderInspector('<video src="/v.mp4"></video>', 'video');
    expect(document.querySelector('.designer-image-preview video')).toHaveAttribute(
      'src',
      'https://cloudlet.test/v.mp4',
    );
    video.unmount();
    renderInspector('<audio src="/a.mp3"></audio>', 'audio');
    expect(document.querySelector('.designer-image-preview audio')).toHaveAttribute(
      'src',
      'https://cloudlet.test/a.mp3',
    );
  });

  it('says nothing is chosen without a source', () => {
    renderInspector('<img>', 'img');
    expect(screen.getByText('Nothing chosen')).toBeInTheDocument();
  });

  it('offers no picker for other elements', () => {
    renderInspector('<div>x</div>', 'div');
    expect(screen.queryByText('Nothing chosen')).not.toBeInTheDocument();
  });
});

describe('Inspector attributes', () => {
  it('says there are none', () => {
    renderInspector('<div>x</div>', 'div');
    expect(screen.getByText('No attributes')).toBeInTheDocument();
  });

  it('lists the attributes without the ones with their own control or the designer owns', () => {
    const { container } = renderInspector(
      '<a href="/x" title="t" id="i" class="c" style="color:red" contenteditable="true" data-magic-selected="1" data-x="2">l</a>',
      'a',
    );
    const labels = Array.from(container.querySelectorAll('.designer-attribute label')).map(
      label => label.textContent,
    );
    expect(labels).toEqual(['href', 'title', 'data-x']);
  });

  it('edits and removes an attribute', async () => {
    const { s, container } = renderInspector('<a href="/x" target="_blank">l</a>', 'a');
    fireEvent.change(attributeInput(container, 'target'), { target: { value: '_self' } });
    expect(s.onSetAttribute).toHaveBeenCalledWith('target', '_self');
    await userEvent.click(screen.getByTitle('Remove href'));
    expect(s.onRemoveAttribute).toHaveBeenCalledWith('href');
  });

  it('links an href, an action and a formaction to the page list but not others', () => {
    const { container } = renderInspector(
      '<form action="/a" formaction="/b" method="post" href="/c"></form>',
      'form',
      { urls: ['/', '/about'] },
    );
    expect(attributeInput(container, 'action')).toHaveAttribute('list', 'designer-urls');
    expect(attributeInput(container, 'formaction')).toHaveAttribute('list', 'designer-urls');
    expect(attributeInput(container, 'href')).toHaveAttribute('list', 'designer-urls');
    expect(attributeInput(container, 'method')).not.toHaveAttribute('list');
    const urls = Array.from(document.querySelectorAll('#designer-urls option')).map(option =>
      option.getAttribute('value'),
    );
    expect(urls).toEqual(['/', '/about']);
  });

  it('locks a server-filled value until it is unlocked on purpose', async () => {
    const { s, container } = renderInspector('<a href="{{url}}" title="plain">l</a>', 'a');
    const filled = attributeInput(container, 'href');
    expect(filled).toHaveAttribute('readonly');
    expect(filled.parentElement).toHaveClass('designer-server-filled');
    expect(filled).toHaveAttribute('title', expect.stringContaining('The server fills this in'));
    expect(attributeInput(container, 'title')).not.toHaveAttribute('readonly');
    expect(screen.queryByTitle('Remove href')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Edit anyway'));
    expect(filled).not.toHaveAttribute('readonly');
    expect(screen.getByTitle('Remove href')).toBeInTheDocument();
    fireEvent.change(filled, { target: { value: '/fixed' } });
    expect(s.onSetAttribute).toHaveBeenCalledWith('href', '/fixed');
  });

  it('adds an attribute on Enter and clears the box', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const box = screen.getByPlaceholderText('Add an attribute…');
    await userEvent.type(box, '  role {Enter}');
    expect(s.onSetAttribute).toHaveBeenCalledWith('role', '');
    expect(box).toHaveValue('');
  });

  it('does not add an empty attribute and ignores other keys', async () => {
    const { s } = renderInspector('<div>x</div>', 'div');
    const box = screen.getByPlaceholderText('Add an attribute…');
    await userEvent.type(box, '   {Enter}');
    await userEvent.type(box, 'q');
    expect(s.onSetAttribute).not.toHaveBeenCalled();
  });

  it('suggests what the tag can still be given', () => {
    renderInspector('<a href="/x" title="t">l</a>', 'a');
    const names = Array.from(document.querySelectorAll('#designer-attributes option')).map(option =>
      option.getAttribute('value'),
    );
    expect(names).toContain('target');
    expect(names).toContain('lang');
    expect(names).not.toContain('href');
    expect(names).not.toContain('title');
  });

  it('suggests only the general attributes for a tag without its own list', () => {
    renderInspector('<section>x</section>', 'section');
    const names = Array.from(document.querySelectorAll('#designer-attributes option')).map(option =>
      option.getAttribute('value'),
    );
    expect(names).toEqual(['title', 'hidden', 'lang', 'dir', 'tabindex', 'role', 'aria-label']);
  });
});
