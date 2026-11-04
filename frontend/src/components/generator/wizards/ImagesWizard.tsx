import { useState } from 'react';
import { showToast } from '../../../lib/toast';
import { IMAGE_OPS } from '../wizardSpecs';

/*
 * Wizard granting image operations. Each ticked operation maps to one [image.*] slot.
 */

export default function ImagesWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [ops, setOps] = useState<Record<string, boolean>>({
    resize: true,
    crop: true,
    convert: true,
    size: true,
    chart: false,
    'generate-qr': false,
  });

  function add() {
    const lines = IMAGE_OPS.filter(op => ops[op.key]).map(op => 'image.' + op.key);
    if (lines.length === 0) {
      showToast('Tick at least one operation', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Images</div>
        {IMAGE_OPS.map(op => (
          <label key={op.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={ops[op.key]}
              onChange={e => setOps({ ...ops, [op.key]: e.target.checked })}
            />
            {op.label}
          </label>
        ))}
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
    </div>
  );
}
