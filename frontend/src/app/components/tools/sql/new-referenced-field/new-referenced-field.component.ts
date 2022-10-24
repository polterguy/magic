// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for creating a new field or key in the specified table.
 */
export class NewReferencedFieldModel {
  databaseType: string;
  connectionString: string;
  table: string;
  database: any;
  name: string;
  field: string;
  datatype: any;
  foreignTable: string;
  foreignField: string;
  fkName: string;
  size: number;
  defaultValue: string;
  acceptNull: boolean;
  cascade: boolean;
}

/**
 * Component allowing user to create a new field or foreign key.
 */
@Component({
  selector: 'app-new-referenced-field',
  templateUrl: './new-referenced-field.component.html',
  styleUrls: ['./new-referenced-field.component.scss']
})
export class NewReferencedFieldComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewReferencedFieldModel) { }

  fieldChanged() {
    this.data.name = this.data.foreignField;
  }

  tableChanged() {
    this.data.foreignField = this.data.database.tables
      .filter((x: any) => x.name === this.data.foreignTable)[0].columns
      .filter((x: any) => x.primary)[0].name;
    this.data.name = this.data.foreignField;
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
    return this.data.foreignTable && this.data.foreignField && this.data.name;
  }
}
