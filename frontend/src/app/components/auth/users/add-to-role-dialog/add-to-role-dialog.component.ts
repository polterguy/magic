
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Role } from '../../models/role.model';
import { RoleService } from '../../services/role.service';
import { User } from 'src/app/components/auth/models/user.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { UserService } from 'src/app/components/auth/services/user.service';

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
  public roles: Role[] = [];

  /**
   * What role to add user to.
   */
  public role: Role = null;

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

    // Fetching available roles from backend.
    this.roleService.list({
      limit: -1,
    }).subscribe((roles: Role[]) => {

      // Assigning result to model, making sure we remove roles user already belongs to.
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

    // Invoking backend to associate user with specified role.
    this.userService.addRole(this.data.username, this.role.name).subscribe(() => {

      // Success! User associated with role.
      this.dialogRef.close(this.data);

      // Updating user object.
      this.data.roles.push(this.role.name);

    }, (error: any) => this.feedbackService.showError(error));
  }
}
