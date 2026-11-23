import './styles/files.css';

import type { FeatureManifest } from '@core/features';
import { CodeFileIcon, FolderIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

import { FILES_SHORTCUTS } from './lib/shortcuts';

const PATH = '/hyper-ide';

const manifest: FeatureManifest = {
  id: 'files',
  path: PATH,
  page: lazy(() => import('./components/Files')),
  nav: {
    label: 'Hyper IDE',
    Icon: CodeFileIcon,
    description:
      'Edit any file on your server, execute Hyperlambda, and turn ' +
      'your endpoints into AI functions.',
    order: 70,
  },
  palette: { entries: () => import('./lib/palette').then(module => module.paletteEntries(PATH)) },
  shortcuts: {
    group: {
      id: 'Hyper IDE',
      title: 'Hyper IDE file actions',
      note: 'With the editor focused.',
      Icon: FolderIcon,
    },
    entries: FILES_SHORTCUTS,
  },
};

export default manifest;
