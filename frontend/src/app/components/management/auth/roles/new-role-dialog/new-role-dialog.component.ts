
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FeedbackService } from 'src/app/services--/feedback.service';
import { Role } from 'src/app/_protected/pages/user-roles/_models/role.model';
import { RoleService } from 'src/app/_protected/pages/user-roles/_services/role.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-new-role-dialog',
  templateUrl: './new-role-dialog.component.html'
})
export class NewRoleDialogComponent {

  /**
   * Name of new role to create.
   */
  name = '';

  /**
   * Description of new role.
   */
  description = '';

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param feedbackService Needed to provide feedback to user
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
   * Returns true if argument name is valid.
   */
  argumentValid() {
    return /^[a-z0-9_]+$/i.test(this.name);
  }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  create() {
    this.roleService.create(this.name, this.description).subscribe({
      next: () => this.dialogRef.close(this.name),
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user clicks the update button to update his role.
   */
  update() {
    this.roleService.update(this.name, this.description).subscribe({
      next: () => this.dialogRef.close(this.name),
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when dialog should simply be closed without updating
   * an existing or creating a new role.
   */
  close() {
    this.dialogRef.close();
  }
}
