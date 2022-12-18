
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { PlatformLocation } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'src/app/_protected/pages/manage/user-and-roles/_models/user.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { AuthenticateResponse } from '../_models/authenticate-response.model';
import { UserService } from '../_services/user.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { ChangePasswordDialogComponent } from '../components/change-password-dialog/change-password-dialog.component';
import { EditUserDialogComponent } from '../components/edit-user-dialog/edit-user-dialog.component';

/**
 * Helper component for displaying all users in the system, and allowing the user to edit and manage his users.
 */
@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent {

  @Input() usersList: any = [];
  @Input() rolesList: any = [];

  @Output() getUsersList = new EventEmitter<any>();

  displayedColumns: string[] = ['username', 'name', 'email', 'role', 'creationDate', 'status', 'actions'];

  /**
   * Specify if the user can delete the selected user
   */
  public userCanDelete: boolean = undefined;

  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private userService: UserService,
    private generalService: GeneralService,
    private backendService: BackendService,
    private platformLocation: PlatformLocation) { }

  /**
   * Invoked when user wants to create a reset password link for a specific user.
   *
   * @param user User to create link for
   */
  generateResetPasswordLink(user: User) {
    this.userService.generateResetPasswordLink(user.username).subscribe({
      next: (result: AuthenticateResponse) => {
        const location: any = this.platformLocation;
        const url = location.location.origin.toString() +
          '/authentication/auto-auth?token=' +
          encodeURIComponent(result.ticket) +
          '&username=' +
          encodeURIComponent(user.username) +
          '&url=' +
          encodeURIComponent(this.backendService.active.url);
        this.clipboard.copy(url);
        this.generalService.showFeedback('Reset password link is copied to your clipboard', 'successMessage', 'Ok', 4000);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
    });
  }

  /**
   * Invoked when user wants to create a login link for user.
   * @param user Selected user.
   */
  generateLoginLink(user: User) {
    this.userService.generateLoginLink(user.username).subscribe({
      next: (result: AuthenticateResponse) => {
        const location: any = this.platformLocation;
        const url = location.location.origin.toString() + '/authentication/auto-auth' +
          '/?token=' +
          encodeURIComponent(result.ticket) +
          '&username=' +
          encodeURIComponent(user.username) +
          '&url=' +
          encodeURIComponent(this.backendService.active.url);

        this.clipboard.copy(url);
        this.generalService.showFeedback('Login link is copied to your clipboard', 'successMessage', 'Ok', 4000);
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000);
        return;
      }
    });
  }

  /**
   * Invoked when user's locked status has changed.
   *
   * @param user User to change lock status of
   */
  lockedChanged(user: User) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `${user?.locked ? 'Unlock' : 'Lock'} user ${user?.username}`,
        description_extra: 'To proceed please type in the <span class="fw-bold">user\'s username</span> below.',
        action_btn: user?.locked ? 'Unlock user' : 'Lock user',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: user,
          action: 'confirmInput',
          fieldToBeTypedTitle: 'username',
          fieldToBeTypedValue: user.username,
          icon: 'do_not_disturb_on'
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.userService.update({
          username: user.username,
          locked: !user.locked
        }).subscribe({
          next: () => {
            user.locked = !user.locked;
            this.generalService.showFeedback(`User is successfully ${user.locked ? 'locked out of system' : 'released to access the system'}`, 'successMessage', 'Ok', 4000);
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        })
      }
    })
  }

  /**
   * Deleting the selected user upon confirmation.
   * @param user Selected user.
   */
  public deleteUser(user: User) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete user ${user?.username}`,
        description_extra: 'This action cannot be undone and will be permanent.<br/><br/>Please type in the <span class="fw-bold">user\'s username</span> below.',
        action_btn: 'Delete user',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: user,
          action: 'confirmInput',
          fieldToBeTypedTitle: 'username',
          fieldToBeTypedValue: user.username,
          icon: 'delete'
        }
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.userService.delete(user.username).subscribe({
          next: () => {
            this.generalService.showFeedback(`${user.username} was successfully deleted`, 'successMessage', 'Ok', 4000);
            this.updateList();
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        });
      }
    });
  }

  getExtra(name: string, el: User) {
    const result = el?.extra?.filter(x => x.type === name) || [];
    if (result.length > 0) {
      return result[0].value;
    }
    return 'N/A';
  }

  /**
   * Opens a dialog for setting a new password.
   * @param user Selected user.
   */
  public changePassword(user: User) {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      data: user
    })
  }

  /**
   * Opens a dialog for editing the selected user.
   * @param user Selected user.
   */
  public editUser(user: User) {
    this.dialog.open(EditUserDialogComponent, {
      width: '800px',
      data: {
        user: user,
      },
      autoFocus: false
    }).afterClosed().subscribe((result: string) => {
      this.updateList();
    })
  }

  private updateList() {
    this.getUsersList.emit({});
  }
}
