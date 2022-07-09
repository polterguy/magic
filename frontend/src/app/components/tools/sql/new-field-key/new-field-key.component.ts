
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
    {name: 'char', size: true},
    {name: 'varchar', size: true},
    {name: 'binary', size: true},
    {name: 'varbinary', size: true},
    {name: 'tinyblob', size: false},
    {name: 'tinytext', size: false},
    {name: 'text', size: true},
    {name: 'blob', size: true},
    {name: 'mediumtext', size: false},
    {name: 'mediumblob', size: false},
    {name: 'longtext', size: false},
    {name: 'longblob', size: false},
    {name: 'bit', size: true},
    {name: 'tinyint', size: true},
    {name: 'bool', size: false},
    {name: 'boolean', size: false},
    {name: 'smallint', size: true},
    {name: 'mediumint', size: true},
    {name: 'int', size: true},
    {name: 'integer', size: true},
    {name: 'bigint', size: true},
    {name: 'double', size: true},
    {name: 'decimal', size: true},
    {name: 'dec', size: true},
    {name: 'date', size: false},
    {name: 'datetime', size: false},
    {name: 'timestamp', size: false},
    {name: 'time', size: false},
    {name: 'year', size: false},
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
