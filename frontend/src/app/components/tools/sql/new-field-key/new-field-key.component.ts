
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for creating a new field or key in the specified table.
 */
export class NewFieldKeyModel {
  databaseType: string;
  connectionString: string;
  table: string;
  database: any;
  type: string;
  name: string;
  field: string;
  datatype: any;
  foreignTable: string;
  foreignField: string;
  fkName: string;
  size: number;
  defaultValue: string;
  acceptNull: boolean;
  hasKey: boolean;
}

/**
 * Component allowing user to create a new field or foreign key.
 */
@Component({
  selector: 'app-new-field-key',
  templateUrl: './new-field-key.component.html',
  styleUrls: ['./new-field-key.component.scss']
})
export class NewFieldKeyComponent {

  // Datatypes specific for MySQL.
  private mySqlDataTypes = [
    {name: 'int', defaultValue: 'number'},
    {name: 'varchar', size: {min: 0, max: 16383, defaultSize: 100}, defaultValue: 'string'},
    {name: 'text', size: {min: 0, max: 65535, defaultSize: 65535}, defaultValue: 'string'},
    {name: 'blob', size: {min: 0, max: 65535, defaultSize: 65535}, defaultValue: false},
    {name: 'bool', defaultValue: 'bool'},
    {name: 'boolean', defaultValue: 'bool'},
    {name: 'double'},
    {name: 'decimal', size: {min: 0, max: 65, defaultSize: 10}},
    {name: 'datetime', defaultValue: 'date'},
    {name: 'timestamp', defaultValue: 'date'},
   ];

  // Datatypes specific for SQLite.
  private sqlIteDataTypes = [
    {name: 'integer', defaultValue: 'int'},
    {name: 'real', defaultValue: 'decimal'},
    {name: 'text', defaultValue: 'string'},
    {name: 'blob', defaultValue: false},
    {name: 'varchar', defaultValue: 'string'},
    {name: 'timestamp', defaultValue: 'date'},
  ];
  private pgsqlDataTypes = [
    {name: 'integer', defaultValue: 'numeric'},
    {name: 'numeric', defaultValue: 'numeric'},
    {name: 'text', defaultValue: 'string'},
    {name: 'timestamp', defaultValue: 'date'},
    {name: 'blob', defaultValue: false},
    {name: 'nvarchar', size: {min: 0, max: 65535}, defaultValue: false},
    {name: 'varchar', size: {min: 0, max: 65535}, defaultValue: 'string'},
  ];
  private mssqlDataTypes = [
    {name: 'integer', defaultValue: 'integer'},
    {name: 'float', defaultValue: 'float'},
    {name: 'real', defaultValue: 'real'},
    {name: 'datetime', defaultValue: 'date'},
    {name: 'text', defaultValue: 'string'},
    {name: 'ntext', defaultValue: 'string'},
    {name: 'blob' },
    {name: 'nvarchar', size: {min: 0, max: 65535}, defaultValue: false},
    {name: 'varchar', size: {min: 0, max: 65535}, defaultValue: 'string'},
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewFieldKeyModel) { }

  /**
   * Returns all fields in table to caller.
   */
  getFields() {
    return this.data.database.tables.filter((x: any) => x.name === this.data.table)[0].columns;
  }

  /**
   * Returns the supported datatypes for the specified database type to caller.
   */
  getDataTypes() {
    switch (this.data.databaseType) {

      case 'mysql':
        return this.mySqlDataTypes;

      case 'sqlite':
        return this.sqlIteDataTypes;

      case 'pgsql':
        return this.pgsqlDataTypes;

      case 'mssql':
        return this.mssqlDataTypes;
      }
  }

  /**
   * Returns all tables in database to caller.
   */
  getTables() {
    return this.data.database.tables.map((x: any) => x.name);
  }

  /**
   * Returns all fields in specified table to caller.
   */
  getForeignField(table: string) {
    return this.data.database.tables.filter((x: any) => x.name == table)[0].columns.map((x: any) => x.name);
  }

  /**
   * Returns true if input is valid.
   */
  verifyInput() {
    switch (this.data.type) {

      case 'field':
        return this.data.name && this.data.datatype && (!this.data.datatype.size || this.data.size);

      case 'key':
        return this.data.field && this.data.foreignTable && this.data.foreignField;
    }
  }

  /**
   * Invoked when datatype changes.
   */
  datatypeChanged() {
    if (this.data.datatype.defaultValue === 'date') {

      switch (this.data.databaseType) {

        case 'mysql':
        case 'sqlite':
        case 'pgsql':
          this.data.defaultValue = 'current_timestamp';
          break;
      }

    } else if (this.data.datatype.defaultValue === 'int') {

      switch (this.data.databaseType) {

        case 'mysql':
        case 'sqlite':
          this.data.defaultValue = 'auto_increment';
          break;
      }

    } else {
      this.data.size = this.data.datatype.size?.defaultSize;
      delete this.data.defaultValue;
    }
  }
}
