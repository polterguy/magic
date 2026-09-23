/*
 * The style properties the designer puts on screen.
 *
 * A deliberately short list. Exposing every CSS property would make the panel
 * a worse text editor than the one already in Hyper IDE; these are the ones
 * you reach for while looking at a page rather than while reading its code.
 */

export interface StyleProperty {
  name: string;
  label: string;
  kind: 'text' | 'color' | 'select';
  options?: string[];
}

export interface StyleGroup {
  label: string;
  properties: StyleProperty[];
}

export const STYLE_GROUPS: StyleGroup[] = [
  {
    label: 'Layout',
    properties: [
      {
        name: 'display',
        label: 'Display',
        kind: 'select',
        options: ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'],
      },
      {
        name: 'flex-direction',
        label: 'Direction',
        kind: 'select',
        options: ['row', 'row-reverse', 'column', 'column-reverse'],
      },
      {
        name: 'justify-content',
        label: 'Justify',
        kind: 'select',
        options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
      },
      {
        name: 'align-items',
        label: 'Align',
        kind: 'select',
        options: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
      },
      { name: 'gap', label: 'Gap', kind: 'text' },
      { name: 'grid-template-columns', label: 'Columns', kind: 'text' },
    ],
  },
  {
    label: 'Spacing & size',
    properties: [
      { name: 'padding', label: 'Padding', kind: 'text' },
      { name: 'margin', label: 'Margin', kind: 'text' },
      { name: 'width', label: 'Width', kind: 'text' },
      { name: 'height', label: 'Height', kind: 'text' },
      { name: 'max-width', label: 'Max width', kind: 'text' },
    ],
  },
  {
    label: 'Text',
    properties: [
      { name: 'color', label: 'Colour', kind: 'color' },
      { name: 'font-size', label: 'Size', kind: 'text' },
      {
        name: 'font-weight',
        label: 'Weight',
        kind: 'select',
        options: ['300', '400', '500', '600', '700', '800', '900'],
      },
      {
        name: 'text-align',
        label: 'Align',
        kind: 'select',
        options: ['left', 'center', 'right', 'justify'],
      },
      { name: 'line-height', label: 'Line height', kind: 'text' },
      { name: 'letter-spacing', label: 'Letter spacing', kind: 'text' },
      {
        name: 'text-transform',
        label: 'Transform',
        kind: 'select',
        options: ['none', 'uppercase', 'lowercase', 'capitalize'],
      },
    ],
  },
  {
    label: 'Background & border',
    properties: [
      { name: 'background-color', label: 'Background', kind: 'color' },
      { name: 'border', label: 'Border', kind: 'text' },
      { name: 'border-radius', label: 'Radius', kind: 'text' },
      { name: 'box-shadow', label: 'Shadow', kind: 'text' },
      { name: 'opacity', label: 'Opacity', kind: 'text' },
    ],
  },
];

/*
 * A colour in the form an <input type="color"> will accept. Computed styles
 * come back as rgb() and the picker only speaks six-digit hex, so anything
 * that is not already hex is converted, and anything that cannot be converted
 * — a gradient, a keyword the browser did not resolve, or a hex the user is
 * still halfway through typing — falls back to [fallback] rather than making
 * the picker refuse the value.
 */
export function toHexColor(value: string, fallback = '#000000'): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return ('#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3])
      .toLowerCase();
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(trimmed);
  if (rgb) {
    return '#' + [rgb[1], rgb[2], rgb[3]]
      .map(part => Math.max(0, Math.min(255, Math.round(Number(part))))
        .toString(16).padStart(2, '0'))
      .join('');
  }
  return fallback;
}
