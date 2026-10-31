/*
 * Turning the raw endpoints list into what a widget's picker actually wants:
 * one entry per table, not one per file.
 *
 * crudify names its files predictably — a table's read endpoint sits at a
 * bare path, its siblings (count, aggregate, create, ...) at that same path
 * plus a suffix or a different verb — but nothing here relies on parsing
 * filenames. The [.type] every endpoint already carries is what crudify
 * itself wrote, so matching on it is matching on the generator's own word for
 * what a file is, not re-deriving a guess from its name.
 */

import { EndpointField, EndpointMeta, listEndpointsDetailed } from '../../lib/api';

export interface DataColumn {
  name: string;
  type: string;
  lookup?: NonNullable<EndpointField['lookup']>;
}

export interface DataSource {
  module: string;
  table: string;
  label: string;
  // Root-absolute, ready to drop straight into data-read-url / data-count-url.
  readUrl: string;
  countUrl: string | null;
  // Both null unless crudify actually generated that verb for this table —
  // the picker's "Allow delete" / "Allow inline editing" checkboxes exist to
  // be disabled when one is, not to offer something that would just 404.
  deleteUrl: string | null;
  updateUrl: string | null;
  // Column names a PUT will accept, the primary key already excluded — a
  // row's own key is identity, not something inline editing should be
  // offered on, whatever crud-update's own input happens to list.
  editableColumns: string[];
  // Derived from crud-delete's own input, which IS the primary key and
  // nothing else — not guessed from column names or position.
  primaryKey: string[];
  columns: DataColumn[];
  // Null unless crudify generated a crud-create endpoint for this table.
  createUrl: string | null;
  // crud-create's own input — already exactly the fields a new row needs and
  // nothing else: no primary key (an auto-increment column is never part of
  // it), no column that has a database default crudify left out. Carries FK
  // [lookup] the same way crud-update's input already does, for the same
  // reason (GetInputArguments attaches it for every post/put endpoint).
  createColumns: DataColumn[];
}

let cache: Promise<EndpointMeta[]> | null = null;

/*
 * Fetched once and reused for the rest of the session. A cloudlet's full
 * endpoint list runs to hundreds of entries — fine to hold in memory, not
 * something worth asking the server for again every time a picker opens.
 */
export function loadEndpoints(refresh = false): Promise<EndpointMeta[]> {
  if (!cache || refresh) {
    cache = listEndpointsDetailed();
  }
  return cache;
}

/*
 * Every table with a crud-read endpoint of its own — that is the one thing
 * that makes a table "relevant" to a Data Grid, and the Create Row widget
 * picks its own table off this same list, by [createUrl] rather than
 * [readUrl]. Its crud-count sibling, if crudify was asked to generate one, is
 * matched by the exact convention crudify itself uses: the same path with
 * "-count" appended. A table without
 * one is still offered; the grid already tolerates a missing count URL by
 * just not showing a total.
 */
export function dataGridSources(endpoints: EndpointMeta[]): DataSource[] {
  const reads = endpoints.filter(endpoint => endpoint.type === 'crud-read' && endpoint.verb === 'get');
  return reads
    .map(read => {
      const segments = read.path.split('/');
      const table = segments.at(-1)!;
      const module = segments.at(-2)!;
      const count = endpoints.find(
        endpoint => endpoint.type === 'crud-count' && endpoint.path === read.path + '-count');
      /*
       * Delete and update share the read endpoint's own path exactly —
       * crudify puts all four verbs for a table at the same URL, only the
       * suffixed siblings (count, aggregate, ...) get a different path.
       */
      const del = endpoints.find(
        endpoint => endpoint.type === 'crud-delete' && endpoint.verb === 'delete' && endpoint.path === read.path);
      const update = endpoints.find(
        endpoint => endpoint.type === 'crud-update' && endpoint.verb === 'put' && endpoint.path === read.path);
      const create = endpoints.find(
        endpoint => endpoint.type === 'crud-create' && endpoint.verb === 'post' && endpoint.path === read.path);
      const primaryKey = (del?.input ?? []).map(field => field.name);
      const editableColumns = (update?.input ?? [])
        .map(field => field.name)
        .filter(name => !primaryKey.includes(name));
      return {
        module,
        table,
        label: module + ' / ' + table,
        readUrl: '/' + read.path,
        countUrl: count ? '/' + count.path : null,
        deleteUrl: del ? '/' + del.path : null,
        updateUrl: update && editableColumns.length > 0 ? '/' + update.path : null,
        editableColumns,
        primaryKey,
        columns: (read.output ?? []).map(column => (
          { name: column.name, type: column.type, lookup: column.lookup })),
        createUrl: create ? '/' + create.path : null,
        createColumns: (create?.input ?? []).map(column => (
          { name: column.name, type: column.type, lookup: column.lookup })),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
