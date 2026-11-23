import './styles/tasks.css';

import type { FeatureManifest } from '@core/features';
import { ClockIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/task-manager';

const manifest: FeatureManifest = {
  id: 'tasks',
  path: PATH,
  page: lazy(() => import('./components/Tasks')),
  nav: {
    label: 'Task Manager',
    Icon: ClockIcon,
    description:
      'Write Hyperlambda tasks and schedule them to run on a repeating ' +
      'pattern, or once at a fixed date.',
    order: 90,
  },
  roomy: true,
  palette: { entries: () => import('./lib/palette').then(module => module.paletteEntries(PATH)) },
};

export default manifest;
