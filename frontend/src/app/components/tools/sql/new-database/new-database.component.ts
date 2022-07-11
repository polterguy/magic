
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for creating a new table.
 */
 export class NewDatabaseModel {
  name: string;
}

/**
 * Component to create a new database.
 */
@Component({
  selector: 'app-new-database',
  templateUrl: './new-database.component.html',
  styleUrls: ['./new-database.component.scss']
})
export class NewDatabaseComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewDatabaseModel) { }
}
