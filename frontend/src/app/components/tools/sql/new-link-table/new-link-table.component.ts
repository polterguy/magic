
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for creating a new table.
 */
 export class NewLinkTableModel {
  tables: any;
  table1: string;
  table2: string;
}

/**
 * Modal dialogue allowing you to create a many2many link table.
 */
@Component({
  selector: 'app-new-link-table',
  templateUrl: './new-link-table.component.html',
  styleUrls: ['./new-link-table.component.scss']
})
export class NewLinkTableComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewLinkTableModel) { }

  /**
   * Returns true if input has been specified.
   */
  getValidInput() {
    return this.data.table1 && this.data.table2 && (this.data.table1 !== this.data.table2);
  }
}
