import { EndpointMeta } from '../../lib/api';

// Width of the description tooltip ExecuteFilesWizard shows next to a file.

export const TOOLTIP_WIDTH = 560;

/*
 * Matches a candidate file's path (e.g. "/modules/oauth/authorize.get.hl") against the
 * {path, verb} shape /magic/system/endpoints/list keys its entries by (e.g.
 * "magic/oauth/authorize" + "get") — null for files with no HTTP-verb suffix, since
 * those are never HTTP endpoints and so never appear in that list.
 */
export const VERB_SUFFIX = /^(.*)\.(get|post|put|patch|delete|socket)\.hl$/;

export function endpointKey(filePath: string): string | null {
  const relative = filePath.replace(/^\/(modules|system)\//, '');
  const match = VERB_SUFFIX.exec(relative);
  return match ? 'magic/' + match[1] + '|' + match[2] : null;
}

/*
 * Pulls the single file-level comment every generated Hyperlambda file carries at its
 * top — a leading /* *\/ block or a leading run of // lines — stripping the comment
 * markers so only the prose remains. Returns null when the file has neither. Used only
 * as a fallback for files endpoints.list never sees (no HTTP-verb suffix, e.g. a startup
 * script or a plain manifest) — every endpoint file's description comes from the backend
 * instead (see endpointKey above), which already applies this exact same rule server-side.
 */
export function extractFileComment(content: string): string | null {
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') {
    i++;
  }
  if (i >= lines.length) {
    return null;
  }
  if (lines[i].trim().startsWith('/*')) {
    const body: string[] = [];
    let line = lines[i].replace(/^\s*\/\*/, '');
    while (i < lines.length && !line.includes('*/')) {
      body.push(line.replace(/^\s*\*\s?/, ''));
      i++;
      line = lines[i] ?? '';
    }
    body.push(line.replace(/\*\/.*$/, '').replace(/^\s*\*\s?/, ''));
    return body.join('\n').trim() || null;
  }
  if (lines[i].trim().startsWith('//')) {
    const body: string[] = [];
    while (i < lines.length && lines[i].trim().startsWith('//')) {
      body.push(lines[i].trim().replace(/^\/\/\s?/, ''));
      i++;
    }
    return body.join('\n').trim() || null;
  }
  return null;
}

export function formatEndpointMeta(meta: EndpointMeta): string {
  const lines = [meta.description ?? 'No description.'];
  if (meta.input && meta.input.length > 0) {
    lines.push('', 'Arguments:');
    for (const field of meta.input) {
      lines.push(
        '  ' +
          field.name +
          ': ' +
          field.type +
          (field.description ? ' — ' + field.description : ''),
      );
    }
  }
  return lines.join('\n');
}

export function formatFallbackMeta(
  description: string,
  args: Record<string, { type: string; mandatory?: boolean }> | null,
): string {
  const lines = [description];
  const names = args ? Object.keys(args) : [];
  if (names.length > 0) {
    lines.push('', 'Arguments:');
    for (const name of names) {
      lines.push(
        '  ' + name + ': ' + args![name].type + (args![name].mandatory ? ' (mandatory)' : ''),
      );
    }
  }
  return lines.join('\n');
}
