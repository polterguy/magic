import { ChevronIcon } from '../Icons';

// The handle on the edge of a rail, which folds and unfolds it.
export default function RailToggle(
  props: Readonly<{
    side: 'left' | 'right';
    shut: boolean;
    showTitle: string;
    hideTitle: string;
    onToggle: () => void;
  }>,
) {
  // The chevron points away from the rail when it is open on the left, and when it is folded on the right.
  const rotated = props.side === 'left' ? !props.shut : props.shut;
  return (
    <button
      className={'designer-rail-toggle ' + props.side}
      title={props.shut ? props.showTitle : props.hideTitle}
      onClick={props.onToggle}
    >
      <span style={{ display: 'flex', transform: rotated ? 'rotate(180deg)' : undefined }}>
        <ChevronIcon />
      </span>
    </button>
  );
}
