/*
 * Automatically generated by Magic
 */

import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role, Roles, UpdateUser, User, UsersService } from '@app/services/users-service';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit {

  /**
   * A form control for roles.
   */
  public rolesCtrl = new FormControl<any>([]);

  /**
   * Stores all the roles in a list.
   */
  public rolesList: any = [];

  /**
   * Setting a variable for the current state of the selected user.
   */
  public userIsLocked: boolean = undefined;

  /**
   * 
   * @param snackbar To show the feedback.
   * @param cdr To detect the changes.
   * @param usersService To access endpoints related to user.
   * @param data To receive data from the parent component.
   */
  constructor(
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private usersService: UsersService,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, roles: Roles[] }) { }

  ngOnInit(): void {
    this.sortRolesBySelected();
    this.rolesCtrl.setValue(this.data.user.role);
    this.userIsLocked = (this.data.user.locked === 1);
  }

  /**
   * Sorts roles' list in a way to have all selected roles listed on top of the list.
   * @param item Role set in the previous step.
   */
  public sortRolesBySelected() {
    this.data.roles = this.data.roles.sort((a: any, b: any) => this.data.user.role.indexOf(b.name) - this.data.user.role.indexOf(a.name));
    this.cdr.detectChanges();
  }

  /**
   * Setting the Role object and deciding what action needs to be made.
   * @param name user's username.
   */
  manageRole(name: string) {
    this.rolesCtrl.disable();
    const value: boolean = (this.rolesCtrl.value.indexOf(name) > -1);
    const item: Role = {
      user: this.data.user.username,
      role: name
    }
    if (value === true) {
      this.addRole(item);
    } else {
      this.removeRole(item);
    }
  }

  /**
   * Invokes the endpoint to add a role to the user's roles.
   * @param item Role set in the previous step.
   */
  public addRole(item: Role) {
    this.usersService.addUserRole(item).subscribe({
      next: (res: any) => {
        if (res && res.result === 'success') {
          this.snackbar.open('Successfully added.', null, { duration: 1000 });
          this.data.user.role = this.rolesCtrl.value;
        }
        this.rolesCtrl.enable();
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  /**
   * Invokes the endpoint to remove a role from the user's roles.
   * @param item Role set in the previous step.
   */
  public removeRole(item: Role) {
    const params: string = `?role=${item.role}&user=${item.user}`;
    this.usersService.removeUserRole(params).subscribe({
      next: (res: any) => {
        if (res && res.affected > 0) {
          this.data.user.role = this.rolesCtrl.value;
          this.snackbar.open('Successfully removed.', null, { duration: 1000 });
        }
        this.rolesCtrl.enable();
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  /**
   * Invokes the endpoint to lock/unlock user.
   */
  public toggleLockUser() {
    this.userIsLocked = !this.userIsLocked;
    const data: UpdateUser = {
      username: this.data.user.username,
      locked: this.userIsLocked
    }
    this.usersService.updateUser(data).subscribe({
      next: (res: any) => {
        if (res && res.affected > 0) {
          this.snackbar.open(`User is ${this.userIsLocked ? 'LOCKED' : 'UNLOCKED'} successfully.`, null, { duration: 3000 });
        }
        this.rolesCtrl.enable();
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  /**
   * Updates the extra field on the selected user's record, 
   * so the UI can be updated without an extra call.
   */
  public updateExtraFields(event: any) {
    this.data.user.extra = event;
  }
}