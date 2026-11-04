import { Fragment } from 'react';

// The guided flow's progress header: choose data, generate, done.
export default function WizardSteps({ step }: Readonly<{ step: number }>) {
  return (
    <div className="wizard-steps">
      {['Choose data', 'Generate', 'Done'].map((label, index) => (
        <Fragment key={label}>
          {index > 0 && <span className="wizard-arrow">→</span>}
          <span className={'step' + (step >= index + 1 ? ' active' : '')}>
            {index + 1} · {label}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
