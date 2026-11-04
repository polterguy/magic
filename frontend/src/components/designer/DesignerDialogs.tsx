import { canonicalUrl } from './designerFiles';
import Media, { Picked } from './Media';
import type { MediaKind } from './mediaKinds';
import type { Home } from './metaTags';
import NewPage from './NewPage';
import { elementOf } from './nodes';

// The media picker and the new-page dialog, whichever of them is open.
export default function DesignerDialogs(
  props: Readonly<{
    choosingMedia: { kind: MediaKind; home?: Home } | null;
    origin: string;
    selected: Node | null;
    onPick: (picked: Picked) => void;
    onCancelMedia: () => void;
    creating: boolean;
    pages: string[];
    onCancelCreate: () => void;
    onCreate: (
      file: string,
      copyFrom: string | null,
      companions: { css: boolean; js: boolean },
    ) => void;
  }>,
) {
  const { choosingMedia, pages } = props;
  return (
    <>
      {choosingMedia && (
        <Media
          kind={choosingMedia.kind}
          origin={props.origin}
          current={elementOf(props.selected)?.getAttribute('src') ?? ''}
          onPick={props.onPick}
          onCancel={props.onCancelMedia}
        />
      )}

      {props.creating && (
        <NewPage
          taken={pages.map(canonicalUrl)}
          pages={pages.map(file => ({ file, url: canonicalUrl(file) }))}
          onCancel={props.onCancelCreate}
          onCreate={props.onCreate}
        />
      )}
    </>
  );
}
