/*
 * One definition of the dashboard's sections — route, label, icon and what
 * the section is for. The navigation and the Welcome guide both read from
 * this, so they can't drift apart.
 */

import {
  BoltIcon,
  ClockIcon,
  CodeFileIcon,
  DatabaseIcon,
  ExchangeIcon,
  GearIcon,
  HomeIcon,
  ListIcon,
  PlayIcon,
  ProfileIcon,
  PuzzleIcon,
  NeuralIcon,
  TerminalIcon,
  UserIcon,
} from './Icons';

export interface Section {
  to: string;
  label: string;
  Icon: () => JSX.Element;
  // Shown on the Welcome guide. The Dashboard itself needs no description.
  description?: string;
}

export const SECTIONS: Section[] = [
  {
    to: '/',
    label: 'Dashboard',
    Icon: HomeIcon,
  },
  {
    to: '/hyper-ide',
    label: 'Hyper IDE',
    Icon: CodeFileIcon,
    description: 'Edit any file on your server, execute Hyperlambda, and turn ' +
      'your endpoints into AI functions.',
  },
  {
    to: '/hyperlambda-playground',
    label: 'Playground',
    Icon: PlayIcon,
    description: 'Execute Hyperlambda on your server and see what it returns, ' +
      'without saving anything first.',
  },
  {
    to: '/sql-studio',
    label: 'SQL Studio',
    Icon: TerminalIcon,
    description: 'Query your databases, and design them — create tables, add ' +
      'columns and foreign keys without writing the DDL yourself.',
  },
  {
    to: '/databases',
    label: 'Databases',
    Icon: DatabaseIcon,
    description: 'Create new databases, connect to existing ones, and take backups.',
  },
  {
    to: '/generator',
    label: 'Endpoint Generator',
    Icon: BoltIcon,
    description: 'Generate complete CRUD APIs from your database tables, or wrap ' +
      'a custom SQL statement in an endpoint of its own.',
  },
  {
    to: '/endpoints',
    label: 'Endpoints',
    Icon: ExchangeIcon,
    description: 'Browse every endpoint by module, invoke them with real ' +
      'arguments, and grab their OpenAPI specification.',
  },
  {
    to: '/user-roles-management',
    label: 'Users & roles',
    Icon: UserIcon,
    description: 'Decide who can reach your backend, and which roles gate which ' +
      'endpoints.',
  },
  {
    to: '/task-manager',
    label: 'Task Manager',
    Icon: ClockIcon,
    description: 'Write Hyperlambda tasks and schedule them to run on a repeating ' +
      'pattern, or once at a fixed date.',
  },
  {
    to: '/machine-learning',
    label: 'Machine Learning',
    Icon: NeuralIcon,
    description: 'Train AI models on your own content by crawling a site or ' +
      'uploading files, then embed them as chatbots.',
  },
  {
    to: '/plugins',
    label: 'Plugins',
    Icon: PuzzleIcon,
    description: 'Install plugins from the plugin repository to extend what ' +
      'your cloudlet can do.',
  },
  {
    to: '/configuration',
    label: 'Configuration',
    Icon: GearIcon,
    description: 'Edit your appsettings.json directly — connection strings, SMTP, ' +
      'authentication and everything else your server runs on.',
  },
  {
    to: '/user-profile',
    label: 'Profile',
    Icon: ProfileIcon,
    description: 'Change your password, and generate long-lived access tokens ' +
      'for pipelines, service accounts and integrations.',
  },
  {
    to: '/log',
    label: 'Log',
    Icon: ListIcon,
    description: 'Read what your backend has been doing, and dig into errors when ' +
      'something goes wrong.',
  },
];
