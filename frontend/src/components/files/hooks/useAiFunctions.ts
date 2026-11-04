import { useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { getFileDescription, listFilesRecursively, mlSnippetCreate } from '../../../lib/api';

/*
 * Declaring Hyperlambda files as AI functions on a machine learning model.
 */
export function useAiFunctions(systemFiles: boolean, setWaiting: (waiting: boolean) => void) {
  // File or folder awaiting a model choice for AI-function generation.
  const [aiFunctionTarget, setAiFunctionTarget] = useState<string | null>(null);

  /*
   * Declares a single Hyperlambda file, or every Hyperlambda file inside a
   * folder, as AI functions on the chosen model. The declaration is the file
   * path; the model reads each tool's description and arguments from the file.
   */
  async function createAiFunctions(target: string, type: string) {
    setAiFunctionTarget(null);
    setWaiting(true);
    try {
      const targets = target.endsWith('.hl')
        ? [target]
        : ((await listFilesRecursively(target, systemFiles)) ?? []).filter(file =>
            file.endsWith('.hl'),
          );
      for (const file of targets) {
        await mlSnippetCreate({
          prompt: file.split('/').pop()!.replace(/\.hl$/, ''),
          completion: await getFileDescription(file),
          type,
          meta: 'FUNCTION_INVOCATION ==> ' + file,
        });
      }
      showToast(targets.length + ' AI function(s) declared on ' + type);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return { aiFunctionTarget, setAiFunctionTarget, createAiFunctions };
}

export type AiFunctions = ReturnType<typeof useAiFunctions>;
