
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'src/app/components/_protected/pages/manage/user-and-roles/_models/user.model';
import { UserService } from '../_services/user.service';
import { GeneralService } from 'src/app/services/general.service';
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

  displayedColumns: string[] = [
    'username',
    'name',
    'email',
    'role',
    'creationDate',
    'actions'
  ];
  userCanDelete: boolean = undefined;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private generalService: GeneralService) { }

  deleteUser(user: User) {

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

        this.generalService.showLoading();
        this.userService.delete(user.username).subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(`${user.username} was successfully deleted`, 'successMessage');
            this.updateList();
          },
          error: (error: any) => {
            
            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          }
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

  changePassword(user: User) {

    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      data: user
    })
  }

  editUser(user: User) {

    this.dialog.open(EditUserDialogComponent, {
      width: '800px',
      data: {
        user: user,
      },
      autoFocus: false
    }).afterClosed().subscribe(() => {

      this.updateList();
    })
  }

  /*
   * Private helper methods.
   */

  private updateList() {

    this.getUsersList.emit();
  }
}
