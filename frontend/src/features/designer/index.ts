import type { FeatureManifest } from '@core/features';
import { LayoutIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

import { DESIGNER_SHORTCUTS } from './lib/shortcuts';

const PATH = '/web-designer';

const manifest: FeatureManifest = {
  id: 'designer',
  path: PATH,
  page: lazy(() => import('./components/WebDesigner')),
  nav: {
    label: 'Web Designer',
    Icon: LayoutIcon,
    description:
      'Design the pages your cloudlet serves — pick an element, drag ' +
      'blocks into place, and edit what it says and how it looks.',
    order: 60,
  },
  shortcuts: {
    group: {
      id: 'Web Designer',
      title: 'Web Designer',
      note: 'On the canvas, or with an element selected.',
      Icon: LayoutIcon,
    },
    entries: DESIGNER_SHORTCUTS,
  },
};

export default manifest;
