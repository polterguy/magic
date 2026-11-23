import { copyToClipboard } from '@core/toast';
import CodeEditor from '@shared/ui/CodeEditor';
import { Modal } from '@shared/ui/Dialogs';

export default function DdlDialog(
  props: Readonly<{ ddl: { title: string; sql: string }; onClose: () => void }>,
) {
  const { ddl } = props;
  return (
    <Modal
      size="lg"
      onClose={props.onClose}
      title={ddl.title}
      actions={
        <>
          <button className="btn btn-secondary" onClick={() => copyToClipboard(ddl.sql, 'The DDL')}>
            Copy
          </button>
          <button className="btn" onClick={props.onClose}>
            Close
          </button>
        </>
      }
    >
      <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={ddl.sql} mode="text/x-sql" readOnly />
      </div>
    </Modal>
  );
}
