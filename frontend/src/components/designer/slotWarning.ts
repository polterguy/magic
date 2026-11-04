/*
 * The warning shown when an edit replaces a value the server fills in.
 */

import { showToast } from '../../lib/toast';
import { slotsDropped } from './html';

/*
 * Says what an edit just took off the page, when it took a value the server
 * was going to fill in.
 *
 * The warning is on the removal, not on the editing. Typing inside one of
 * these is a real edit and passes in silence; turning one into fixed text
 * is the mistake, and it is the kind that shows up weeks later as a page
 * quietly serving last month's title.
 */
export function reportDropped(before: string, after: string) {
  const gone = slotsDropped(before, after);
  if (gone.length === 0) {
    return;
  }
  showToast(
    gone.join(' and ') +
      (gone.length === 1 ? ' was' : ' were') +
      ' filled in by the server. Fixed text means the page stops asking — undo ' +
      'if that was not the idea.',
    true,
  );
}
