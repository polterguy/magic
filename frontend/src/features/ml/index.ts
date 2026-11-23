import './styles/ml.css';

import type { FeatureManifest } from '@core/features';
import { NeuralIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/machine-learning';

const manifest: FeatureManifest = {
  id: 'ml',
  path: PATH,
  page: lazy(() => import('./components/MachineLearning')),
  nav: {
    label: 'Machine Learning',
    Icon: NeuralIcon,
    description:
      'Train AI models on your own content by crawling a site or ' +
      'uploading files, then embed them as chatbots.',
    order: 50,
  },
  roomy: true,
  palette: { entries: () => import('./lib/palette').then(module => module.paletteEntries(PATH)) },
};

export default manifest;
