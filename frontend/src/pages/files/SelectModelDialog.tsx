import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import { Modal } from '../../components/Dialogs';
import Select from '../../components/Select';
import { mlTypes } from '../../lib/api';

/*
 * Lets the user pick which AI model a generated function should be added to,
 * the way the old dashboard's select-model dialog does.
 */
export default function SelectModelDialog(props: {
  target: string;
  onClose: () => void;
  onSelected: (type: string) => void;
}) {

  const [types, setTypes] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    mlTypes()
      .then(list => {
        setTypes(list ?? []);
        setType(list?.[0]?.type ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <Modal width={520} onClose={props.onClose}>
      <h2>Create AI function</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Adds {props.target} as an AI function to the model you select.
      </p>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <label className="modal-label">
        Model
        <Select value={type} onChange={value => setType(value)}>
          {types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </Select>
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={() => props.onSelected(type)} disabled={!type}>
          Create
        </button>
      </div>
    </Modal>
  );
}
