
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, Injector } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Role } from 'src/app/models/role.model';
import { RoleService } from 'src/app/services/role.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-new-role-dialog',
  templateUrl: './new-role-dialog.component.html',
  styleUrls: ['./new-role-dialog.component.scss']
})
export class NewRoleDialogComponent {

  /**
   * Name of new role to create.
   */
  public name = '';

  /**
   * Description of new role.
   */
  public description = '';

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param roleService Needed to be able to create or update a role
   * @param data If updating role, this is the role we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<NewRoleDialogComponent>,
    private feedbackService: FeedbackService,
    private roleService: RoleService,
    @Inject(MAT_DIALOG_DATA) public data: Role) {
    if (this.data) {
      this.name = data.name;
      this.description = data.description;
    }
  }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  public create() {

    // Invoking backend to create a new role.
    this.roleService.create(this.name, this.description).subscribe((res: any) => {

      // Success! Closing dialog and informing the caller the name of the new role.
      this.dialogRef.close(this.name);
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the update button to update his role.
   */
  public update() {

    // Invoking backend to create a new role.
    this.roleService.update(this.name, this.description).subscribe(() => {

      // Success! Closing dialog and informing the caller the name of the new role.
      this.dialogRef.close(this.name);
    }, (error: any) => this.feedbackService.showError(error));
  }
}
