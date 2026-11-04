import AiWaiter from '../AiWaiter';
import InvokePanel from '../InvokePanel';
import ResponseDialog from '../ResponseDialog';
import DebugDialog from '../DebugDialog';
import OpenApiDialog from '../OpenApiDialog';
import GitPanel from '../GitPanel';
import { Modal } from '../Dialogs';
import SelectModelDialog from './SelectModelDialog';
import type { AiFunctions } from './hooks/useAiFunctions';
import type { Execution } from './hooks/useExecution';

/*
 * Every dialog the Hyper IDE opens over the page — the model picker, the
 * OpenAPI specification, the Git panel, the waiter, the endpoint invoker, the
 * debug recording and the execution result.
 */
export default function IdeDialogs(
  props: Readonly<{
    selectedFile: string;
    waiting: boolean;
    aiFunctions: AiFunctions;
    openApiSpec: { json: string; target: string } | null;
    onCloseOpenApi: () => void;
    onOpenApi: (target: string) => Promise<void>;
    gitTarget: string | null;
    onCloseGit: () => void;
    onGitChanged: (gitTarget: string) => Promise<void>;
    execution: Execution;
  }>,
) {
  const { selectedFile, aiFunctions, openApiSpec, gitTarget, execution } = props;
  const { aiFunctionTarget } = aiFunctions;
  const { invokeTarget, recording, executeResult } = execution;
  return (
    <>
      {aiFunctionTarget !== null && (
        <SelectModelDialog
          target={aiFunctionTarget}
          onClose={() => aiFunctions.setAiFunctionTarget(null)}
          onSelected={type => aiFunctions.createAiFunctions(aiFunctionTarget, type)}
        />
      )}
      {openApiSpec !== null && (
        <OpenApiDialog
          json={openApiSpec.json}
          target={openApiSpec.target}
          onClose={props.onCloseOpenApi}
        />
      )}
      {gitTarget !== null && (
        <GitPanel
          path={gitTarget}
          onClose={props.onCloseGit}
          onChanged={() => props.onGitChanged(gitTarget)}
        />
      )}
      {(execution.generating || props.waiting) && <AiWaiter />}
      {invokeTarget && (
        <Modal width={860} onClose={() => execution.setInvokeTarget(null)}>
          <h2 style={{ marginTop: 0 }}>
            {invokeTarget.verb.toUpperCase()} {invokeTarget.path}
          </h2>
          <InvokePanel
            endpoint={invokeTarget}
            /*
             * The invoker stays mounted behind the recording, exactly as it does
             * behind a response — so closing the recording returns to the same
             * form with its arguments still filled in.
             */
            onDebug={args => execution.runDebug(args)}
            /*
             * The invoker stays mounted behind the response, so closing the
             * response returns to the same form with its arguments still
             * filled in — tweak one and invoke again.
             */
            onResult={result => {
              execution.setResultWasHttp(true);
              execution.setExecuteResult(result);
            }}
            onOpenApi={() => props.onOpenApi(selectedFile)}
          />
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => execution.setInvokeTarget(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {recording !== null && (
        <DebugDialog
          filename={selectedFile}
          recording={recording}
          onClose={() => execution.setRecording(null)}
        />
      )}
      {executeResult !== null && (
        <ResponseDialog
          result={executeResult}
          httpInvocation={execution.resultWasHttp}
          onClose={() => execution.setExecuteResult(null)}
        />
      )}
    </>
  );
}
