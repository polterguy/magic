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

export { default as OptionPill } from '../OptionPill';
