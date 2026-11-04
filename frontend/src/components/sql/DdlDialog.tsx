import { copyToClipboard } from '../../lib/toast';
import CodeEditor from '../CodeEditor';
import { Modal } from '../Dialogs';

export default function DdlDialog(
  props: Readonly<{ ddl: { title: string; sql: string }; onClose: () => void }>,
) {
  const { ddl } = props;
  return (
    <Modal width={760} onClose={props.onClose}>
      <h2>{ddl.title}</h2>
      <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={ddl.sql} mode="text/x-sql" readOnly />
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={() => copyToClipboard(ddl.sql, 'The DDL')}>
          Copy
        </button>
        <button className="btn" onClick={props.onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
