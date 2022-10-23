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
    {
      name: 'int',
      description: 'Whole number without support for decimals. Often used as primary keys or foreign keys pointing to other tables.',
      defaultValue: 'number'
    },
    {
      name: 'varchar',
      description: 'Text type for strings of varying size. This type can be indexed implying faster filtering, sorting and searching.',
      size: {
        min: 0,
        max: 16383,
        defaultSize: 100
      },
      defaultValue: 'string'
    },
    {
      name: 'mediumtext',
      description: 'Text type for strings up to 16MB. This type cannot be indexed and is for longer text fields and can also be used to store images and files.',
      defaultValue: 'string'
    },
    {
      name: 'bool',
      description: 'Yes/no type used for checkboxes and similar constructs. Can only hold two values; true or false which are the equivalent of yes and no.',
      defaultValue: 'bool'
    },
    {
      name: 'decimal',
      description: 'Real number with fixed amount of decimals. Typically used when exact calculations are crucial, such as for money and similar constructs.',
    },
    {
      name: 'datetime',
      description: 'Date and time type with a range between 1000-01-01 00:00:00 and 9999-12-31 23:59:59. Stored internally as local time zone.',
      defaultValue: 'date'
    },
   ];

  // Datatypes specific for SQLite.
  private sqlIteDataTypes = [
    {
      name: 'integer',
      description: 'Integer number without support for decimals. Typically used as primary keys or foreign keys pointing to other tables.',
      defaultValue: 'int'
    },
    {
      name: 'numeric',
      description: 'Real number with fixed amount of decimals. Typically used when exact calculations are crucial, such as for money and similar constructs.',
      defaultValue: 'decimal'
    },
    {
      name: 'text',
      description: 'Text type for any type of text, images or files. Notice, SQLite does not provide two separate types for short strings and longer strings, so this type is used for both.',
      defaultValue: 'string'
    },
    {
      name: 'varchar',
      description: 'Text type for strings of varying size.',
      size: {
        min: 0,
        max: 16383,
        defaultSize: 100
      },
      defaultValue: 'string'
    },
    {
      name: 'timestamp',
      description: 'Date and time type of field. Notice, this type automatically converts to UTC when stored, and is returned as a UTC string to the client once retrieved.',
      defaultValue: 'date'
    },
  ];

  // PostgreSQL data types.
  private pgsqlDataTypes = [
    {
      name: 'integer',
      description: 'Integer data type allowing you to store numbers from -2,147,483,648 to 2,147,483,647 and is often used for primary keys and foreign keys.',
      defaultValue: 'numeric'
    },
    {
      name: 'numeric',
      description: 'Real number type with fixed point precision making it useful for storing data such as for instance money.',
      defaultValue: 'numeric'
    },
    {
      name: 'text',
      description: 'Allows you to store strings of unlimited length and is useful for pieces of text where you do not know the maximum length. Also useful for images and files.',
      defaultValue: 'string'
    },
    {
      name: 'boolean',
      description: 'Yes/no type used for checkboxes and similar constructs. Can only hold two values; true or false which are the equivalent of yes and no.',
      defaultValue: 'bool'
    },
    {
      name: 'timestamptz',
      description: 'Date and time type with time zone information. Notice, internally PostgreSQL will store the field as UTC.',
      defaultValue: 'date'
    },
  ];

  // SQL Server data types.
  private mssqlDataTypes = [
    {
      name: 'int',
      description: 'Integer data type allowing you to store numbers from -2,147,483,648 to 2,147,483,647 and is usually used for primary keys and foreign keys.',
      defaultValue: 'integer'
    },
    {
      name: 'decimal',
      description: 'Real number with fixed amount of decimals. Typically used when exact calculations are crucial, such as for money and similar constructs.',
      defaultValue: 'decimal'
    },
    {
      name: 'datetime2',
      description: 'Date and time type with a range between 0001-01-01 00:00:00 and 9999-12-31 23:59:59. Does not preserve time zone information.',
      defaultValue: 'date'
    },
    {
      name: 'nvarchar',
      description: 'Variable length UNICODE string that can hold lengths up to 2GB in size if you set it to its maxim length value being 4,000.',
      size: {
        min: 0,
        max: 4000
      },
      defaultValue: false
    },
    {
      name: 'ntext',
      description: 'Variable length UNICODE string that can hold strings up to 1,073,741,823 bytes in length. Also usefule for images and files.',
      defaultValue: 'string'
    },
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
