/*
 * Types shared by the endpoint generator's tabs, wizards and helpers.
 */

import { ColumnMeta } from '../../lib/api';

/*
 * A locked column holds its row's owner: crudify removes it from the endpoint's
 * arguments and output, fills it in on create, and adds it to the WHERE of
 * every read, update and delete. 'username' locks to the caller's username,
 * 'custom' to whatever the named slot returns (a tenant id, for instance).
 */
export interface ColumnLock {
  mode: 'none' | 'username' | 'custom';
  slot: string;
}

/*
 * A column as crudify sees it: the schema's column, plus the foreign key lookup
 * it may carry.
 */
export interface CrudColumn extends ColumnMeta {
  foreign_key?: {
    foreign_table: string;
    foreign_column: string;
    foreign_name?: string | null;
    long_data?: boolean;
  } | null;
}

export interface CrudTable {
  name: string;
  columns?: CrudColumn[] | null;
}

// A column decorated with which verbs take it, what it is locked to and how its value is handled.
export interface DecoratedColumn extends CrudColumn {
  post?: boolean;
  get?: boolean;
  put?: boolean;
  delete?: boolean;
  locked?: string;
  handling?: string;
}

// One argument of a generated endpoint.
export interface CrudifyArgument {
  name: string;
  type?: string;
  locked?: string;
  handling?: string;
  foreign_key?: {
    table: string;
    column: string;
    name: string;
    long?: boolean;
  };
}

// The body crudify takes, one per table and verb.
export type CrudifyPayload = {
  databaseType: string;
  database: string;
  moduleName: string;
  moduleUrl: string;
  table: string;
  verb: string;
  returnId: boolean;
  overwrite: boolean;
  verbose: boolean;
  join: boolean;
  cqrs: boolean;
  cqrsAuthorisation?: string;
  cqrsAuthorisationValues?: string;
  auth?: string;
  log?: string;
  template?: string;
  paging?: boolean;
  sorting?: boolean;
  aggregate?: boolean;
  distinct?: boolean;
  search?: boolean;
  cache?: number;
  publicCache?: boolean;
  args: {
    columns: CrudifyArgument[];
    // DELETE's primary keys are { column: type } pairs, PUT's are full arguments.
    primary: (CrudifyArgument | Record<string, string | undefined>)[];
  };
};

export interface CrudifyOptions {
  auth: string[];
  logging: boolean;
  cache: number;
  publicCache: boolean;
  overwrite: boolean;
  paging: boolean;
  sorting: boolean;
  aggregate: boolean;
  distinct: boolean;
  search: boolean;
  verbose: boolean;
  // URL overrides — module defaults to the database name, component to the
  // table name (and is only overridable when one single table is selected,
  // like the old dashboard).
  moduleName: string;
  moduleUrl: string | null;
  // Publishes a web socket message after every POST/PUT/DELETE, so open
  // clients can refresh. Audience is inherited (the endpoint's own roles),
  // or an explicit comma separated list of roles, groups or users.
  live?: boolean;
  liveAudience?: string;
  liveValues?: string;
  // Column name -> slot its value is locked to ('' = not locked), see resolveLocks().
  locks: Record<string, string>;
}

export interface RoleRule {
  role: string;
  // Optional per-role overrides — blank inherits from a later rule or the base.
  limit: string;
  window: string;
  timeout: string;
  slots: string;
  // Optional short sentence of what this role can do — stitched into the generated
  // endpoint's own file level comment, which MCP surfaces as the tool description.
  description: string;
}

// One rule of a sandbox endpoint's policy, as the generated endpoint reads it.
export interface PolicyRule {
  role: string;
  slots: string[];
  limit?: number;
  window?: number;
  timeout?: number;
  description?: string;
}

// The policy a sandbox endpoint is generated with, sent to the backend as JSON.
export interface SandboxPolicy {
  overrideRoot: boolean;
  returnCode: boolean;
  rules: PolicyRule[];
  maxHyperlambda?: number;
}

// A named group of slots one checkbox of a GroupWizard grants.

export interface SlotGroup {
  key: string;
  label: string;
  title?: string;
  slots: string[];
}
export interface WizardSpec {
  label: string;
  title: string;
  note?: string;
  defaults: string[];
  groups: SlotGroup[];
}

// What every capability wizard takes: where its slot lines go, and how to close it.
export type WizardProps = Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>;

// An endpoint that was just generated, so it can be opened straight from the generator.
export interface GeneratedInfo {
  path: string;
  file: string;
  verb: string;
}

// What the guided flow's generation produced, and where it lives.
export interface CrudDone {
  generated: number;
  loc: number;
  module: string;
}
