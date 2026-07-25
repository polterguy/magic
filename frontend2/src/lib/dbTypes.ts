/*
 * Per-dialect column type catalogs, matching the old SQL Studio designer.
 * `size` marks types that take a length; `varcharDefault` is the length
 * pre-filled when the type is chosen.
 */

export interface FieldType {
  name: string;
  size?: boolean;
  varcharDefault?: number;
}

export const FIELD_TYPES: Record<string, FieldType[]> = {
  mysql: [
    { name: 'int' },
    { name: 'varchar', size: true, varcharDefault: 255 },
    { name: 'mediumtext' },
    { name: 'bool' },
    { name: 'decimal' },
    { name: 'datetime' },
  ],
  sqlite: [
    { name: 'integer' },
    { name: 'numeric' },
    { name: 'text' },
    { name: 'timestamp' },
  ],
  pgsql: [
    { name: 'integer' },
    { name: 'numeric' },
    { name: 'text' },
    { name: 'boolean' },
    { name: 'timestamptz' },
  ],
  mssql: [
    { name: 'int' },
    { name: 'decimal' },
    { name: 'datetime2' },
    { name: 'nvarchar', size: true, varcharDefault: 255 },
    { name: 'ntext' },
  ],
};

export const PK_TYPES = [
  { value: 'auto_increment', name: 'Auto increment' },
  { value: 'varchar', name: 'Varchar' },
];
