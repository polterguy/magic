import { showToast } from '../../lib/toast';
import { explainHyperlambda } from '../../lib/support';
import { modeForFile } from '../../lib/editor';
import { aiContextForFile } from '../../lib/api';
import AiPrompt from '../AiPrompt';
import CodeEditor from '../CodeEditor';
import FileTabs from './FileTabs';
import type { OpenTabs } from './hooks/useOpenTabs';
import type { TabActions } from './hooks/useTabActions';
import type { Execution } from './hooks/useExecution';
import type { FileOperations } from './hooks/useFileOperations';

/*
 * The pane right of the file tree — the open tabs, the editor for the
 * selected file and the AI prompt below it.
 */
export default function EditorPane(
  props: Readonly<{
    tabs: OpenTabs;
    tabActions: TabActions;
    execution: Execution;
    operations: FileOperations;
    activeFolder: string;
  }>,
) {
  const { tabs, tabActions, execution, operations, activeFolder } = props;
  const { openFiles, selectedFile, current, content, updateContent } = tabs;
  const { save, closeFile } = tabActions;
  const { editorRef } = execution;
  return (
    <div className="file-editor">
      {openFiles.length > 0 && (
        <FileTabs
          openFiles={openFiles}
          selectedFile={selectedFile}
          onSelect={tabs.setSelectedFile}
          onClose={closeFile}
        />
      )}
      {current ? (
        <CodeEditor
          key={selectedFile}
          value={content}
          onChange={updateContent}
          mode={modeForFile(selectedFile)}
          onSave={save}
          onExecute={execution.execute}
          undoableEditId={tabs.contentEditId}
          // Only Hyperlambda — the support bot answers about that.
          onHelp={selectedFile.endsWith('.hl') ? explainHyperlambda : undefined}
          onInstance={instance => {
            if (editorRef.current === instance) {
              return;
            }
            editorRef.current = instance;
            /*
             * The editor is keyed on the open file, so this runs for every
             * open, tab switch and restored workspace — the moments where
             * the editor becomes the thing you are looking at. Focusing it
             * makes Ctrl+S, Ctrl+Space and F5 work without a click first.
             */
            instance.focus();
          }}
          onSelectionChange={execution.setHasSelection}
          onAction={action => {
            switch (action) {
              case 'newFile':
                void operations.newFile(activeFolder);
                break;
              case 'newFolder':
                void operations.newFolder(activeFolder);
                break;
              case 'renameFile':
                void operations.rename(selectedFile, false);
                break;
              case 'deleteFile':
                void operations.removeFile(selectedFile);
                break;
              case 'deleteFolder':
                void operations.removeFolder(activeFolder);
                break;
              case 'close':
                void closeFile(selectedFile);
                break;
              case 'nextTab':
                tabs.switchTab(1);
                break;
              case 'previousTab':
                tabs.switchTab(-1);
                break;
            }
          }}
        />
      ) : (
        <div className="card muted" style={{ flex: 1 }}>
          Select a file in the tree to start editing.
        </div>
      )}
      {current && (
        <AiPrompt
          fileType={selectedFile.substring(selectedFile.lastIndexOf('.') + 1)}
          getContext={() => aiContextForFile(selectedFile, content)}
          getOldCode={() => content}
          session={selectedFile}
          onResult={updateContent}
          onError={message => showToast(message, true)}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
}
