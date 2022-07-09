
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
  field: string;
  datatype: any;
  foreignTable: string;
  foreignField: string;
  fkName: string;
  size: number;
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
    {name: 'char', size: {min: 0, max: 255}},
    {name: 'varchar', size: {min: 0, max: 16383}},
    {name: 'binary', size: {min: 0, max: 255}},
    {name: 'varbinary', size: {min: 0, max: 16383}},
    {name: 'tinyblob'},
    {name: 'tinytext'},
    {name: 'text', size: {min: 0, max: 65535}},
    {name: 'blob', size: {min: 0, max: 65535}},
    {name: 'mediumtext'},
    {name: 'mediumblob'},
    {name: 'longtext'},
    {name: 'longblob'},
    {name: 'bit', size: {min: 1, max: 64}},
    {name: 'tinyint', size: {min: 0, max: 255}},
    {name: 'bool'},
    {name: 'boolean'},
    {name: 'smallint', size: {min: 0, max: 65535}},
    {name: 'mediumint', size: {min: 0, max: 255}},
    {name: 'int', size: {min: 0, max: 255}},
    {name: 'integer', size: {min: 0, max: 255}},
    {name: 'bigint', size: {min: 0, max: 255}},
    {name: 'double', size: {min: 0, max: 65535}},
    {name: 'decimal', size: {min: 0, max: 65}},
    {name: 'dec', size: {min: 0, max: 65}},
    {name: 'date'},
    {name: 'datetime'},
    {name: 'timestamp'},
    {name: 'time'},
    {name: 'year'},
  ];

  // Datatypes specific for SQLite.
  private sqlIteDataTypes = [
    {name: 'integer'},
    {name: 'varchar'},
    {name: 'text'},
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewFieldKeyModel) { }

  /**
   * Returns all fields in table to caller.
   */
  getFields() {
    return this.data.database.tables.filter(x => x.name === this.data.table)[0].columns;
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
}
