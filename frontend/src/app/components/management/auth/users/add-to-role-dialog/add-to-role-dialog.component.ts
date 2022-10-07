
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Role } from '../../../../../_protected/pages/user-roles/_models/role.model';
import { RoleService } from '../../../../../_protected/pages/user-roles/_services/role.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { User } from 'src/app/_protected/pages/user-roles/_models/user.model';
import { UserService } from 'src/app/_protected/pages/user-roles/_services/user.service';

/**
 * Modal dialog component allowing you to add a specific user
 * to a specific role.
 */
@Component({
  selector: 'app-add-to-role',
  templateUrl: './add-to-role-dialog.component.html'
})
export class AddToRoleDialogComponent implements OnInit {

  /**
   * What roles are available for us.
   */
  roles: Role[] = [];

  /**
   * What role to add user to.
   */
  role: Role = null;

  /**
   * Creates an instance of your component.
   *
   * @param userService Used to associate user with new role
   * @param roleService Needed to retrieve roles from backend
   * @param feedbackService Used to display feedback to user
   * @param dialogRef Dialog reference used to close dialog
   * @param data Needed to know which user we're associating with the new role
   */
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<AddToRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User) { }


  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.roleService.list({
      limit: -1,
    }).subscribe((roles: Role[]) => {
      this.roles = roles.filter(x => this.data.roles?.indexOf(x.name) === -1);
      if (this.roles.length > 0) {
        this.role = this.roles[0];
      }
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Adds user to specified role.
   */
  public add() {
    this.userService.addRole(this.data.username, this.role.name).subscribe(() => {
      this.dialogRef.close(this.data);
      this.data.roles.push(this.role.name);
    }, (error: any) => this.feedbackService.showError(error));
  }
}
