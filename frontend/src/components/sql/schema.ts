/*
 * Pure helpers behind the Designer: its table filter, and its new-table and add-column dialogs.
 */

import type { ColumnMeta, TableMeta } from '../../lib/api';
import type { FieldType } from '../../lib/dbTypes';

// Derive the PK name from the table name like the old dialog does.
export function primaryKeyName(tableName: string) {
  const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
  return singular + '_id';
}

export function canCreateTable(tableName: string, pkName: string) {
  return Boolean(tableName && pkName);
}

export interface ColumnPayload {
  columnName: string;
  columnType: string;
  defaultValue: string | null;
  nullable: boolean;
  columnLength: number | null;
  foreignTable: string;
  foreignField: string;
  cascading: boolean;
}

// Default to a text column — the most common case — rather than the first
// (numeric) type: the exact `text` where a dialect has it, else varchar/nvarchar.
export function defaultFieldType(fieldTypes: FieldType[]) {
  return (
    fieldTypes.find(t => t.name === 'text') ??
    fieldTypes.find(t => /char|text/.test(t.name)) ??
    fieldTypes[0]
  );
}

// The foreign field is the referenced table's primary key.
export function foreignPrimaryKey(tables: TableMeta[], foreignTable: string) {
  const foreignMeta = tables.find(table => table.name === foreignTable);
  return (foreignMeta?.columns ?? []).find(column => column.primary);
}

// Only tables with a primary key can be referenced by a foreign key.
export function referenceableTables(tables: TableMeta[]) {
  return tables.filter(table => (table.columns ?? []).some(c => c.primary));
}

export function canAddColumn(columnName: string, mode: string, foreignPk: ColumnMeta | undefined) {
  return !(!columnName || (mode === 'foreign' && !foreignPk));
}

/*
 * What the add-column dialog submits — a foreign key column typed after the
 * referenced primary key, or a plain field. Null when a foreign key is
 * missing its name, table or primary key, and nothing should be submitted.
 */
export function columnPayload(
  mode: string,
  fields: {
    columnName: string;
    fieldTypes: FieldType[];
    fieldType: FieldType;
    columnLength: string;
    defaultValue: string;
    nullable: boolean;
    foreignTable: string;
    foreignPk: ColumnMeta | undefined;
    cascading: boolean;
  },
): ColumnPayload | null {
  const { columnName, fieldTypes, fieldType, columnLength, defaultValue, nullable } = fields;
  const { foreignTable, foreignPk, cascading } = fields;
  // A column needs a name in either mode; Enter in the dialog gets here without going through the disabled button.
  if (!columnName) {
    return null;
  }
  if (mode === 'foreign') {
    if (!foreignTable || !foreignPk) {
      return null;
    }
    return {
      columnName,
      columnType: foreignPk.hl === 'string' ? 'varchar' : fieldTypes[0].name,
      defaultValue: null,
      nullable,
      columnLength: foreignPk.hl === 'string' ? Number(columnLength) : null,
      foreignTable,
      foreignField: foreignPk.name,
      cascading,
    };
  }
  return {
    columnName,
    columnType: fieldType.name,
    defaultValue: defaultValue || null,
    nullable,
    columnLength: fieldType.size ? Number(columnLength) : null,
    foreignTable: '',
    foreignField: '',
    cascading: false,
  };
}

// A table matches the filter when its name, or the name of one of its columns, contains it.
export function filterTables(tables: TableMeta[], filter: string) {
  const needle = filter.trim().toLowerCase();
  if (!needle) {
    return tables;
  }
  return tables.filter(
    table =>
      table.name.toLowerCase().includes(needle) ||
      (table.columns ?? []).some(column => column.name.toLowerCase().includes(needle)),
  );
}
