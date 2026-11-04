import { useState } from 'react';
import { showError } from '../../../lib/errors';
import { getOpenApiSpec } from '../../../lib/api';

/*
 * The OpenAPI specification shown in a dialog, for a file or a folder.
 */
export function useOpenApi(setWaiting: (waiting: boolean) => void) {
  const [openApiSpec, setOpenApiSpec] = useState<{ json: string; target: string } | null>(null);

  // Shows the OpenAPI specification for a file (single endpoint) or folder (all endpoints inside it).
  async function showOpenApi(target: string) {
    setWaiting(true);
    try {
      const spec = await getOpenApiSpec(target);
      setOpenApiSpec({ json: JSON.stringify(spec, null, 2), target });
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return { openApiSpec, setOpenApiSpec, showOpenApi };
}
