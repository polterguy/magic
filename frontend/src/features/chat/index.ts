import type { FeatureManifest } from '@core/features';
import { lazy } from 'react';

import { CHAT_SHORTCUTS } from './shortcuts';

// Chat Ops has no page of its own: it lives in the layout, over whatever page is showing.
const manifest: FeatureManifest = {
  id: 'chat',
  shell: lazy(() => import('./ChatShell')),
  shortcuts: { entries: CHAT_SHORTCUTS },
};

export default manifest;
