/*
 * A checkbox drawn as a pill that fills in when it is on - the app's toggle, on option cards and
 * in dialogs alike.
 */
export default function OptionPill(
  props: Readonly<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    title?: string;
    mono?: boolean;
  }>,
) {
  return (
    <label className={'opt-pill' + (props.mono ? ' mono' : '')} title={props.title}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={e => props.onChange(e.target.checked)}
      />
      {props.label}
    </label>
  );
}
