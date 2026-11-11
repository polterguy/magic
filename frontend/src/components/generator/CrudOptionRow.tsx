import { ReactNode } from 'react';

// One row of the CRUD options card: a label with a short hint on the left, its controls on the right.
export default function CrudOptionRow(
  props: Readonly<{ label: string; hint?: ReactNode; children: ReactNode }>,
) {
  return (
    <div className="crud-opt-row">
      <div className="crud-opt-label">
        <div className="crud-opt-title">{props.label}</div>
        {props.hint && <div className="crud-opt-hint">{props.hint}</div>}
      </div>
      <div className="crud-opt-controls">{props.children}</div>
    </div>
  );
}

// A checkbox drawn as a pill that fills in when it is on.
export function OptionPill(
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
