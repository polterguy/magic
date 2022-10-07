
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specifif imports.
import { User_Extra } from '../../../../../_protected/pages/user-roles/_models/user.model';

@Component({
  selector: 'app-edit-extra',
  templateUrl: './edit-extra.component.html',
})
export class EditExtraComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: User_Extra) { }
}
