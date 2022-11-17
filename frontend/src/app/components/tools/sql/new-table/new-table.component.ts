
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for creating a new table.
 */
export class NewTableModel {
  name: string;
  pkName: string;
  pkType: string;
  pkLength: number;
  pkDefault: string;
}

/**
 * Component for creating a new table and add it to the database.
 */
@Component({
  selector: 'app-new-table',
  templateUrl: './new-table.component.html',
  styleUrls: ['./new-table.component.scss']
})
export class NewTableComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewTableModel) { }

  /**
   * Returns true if input is valid and table can be created.
   */
  getValidInput() {
    return this.data.name && this.data.pkName && this.data.pkType && this.data.pkLength;
  }

  /**
   * Invoked when name changes.
   */
  nameChanged() {
    this.data.pkName = this.data.name + '_id';
    this.data.pkType = 'auto_increment';
    this.data.pkLength = 10;
  }
}
