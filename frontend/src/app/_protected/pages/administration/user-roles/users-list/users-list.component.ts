import { PlatformLocation } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User } from 'src/app/_protected/pages/administration/user-roles/_models/user.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { AuthenticateResponse } from '../_models/authenticate-response.model';
import { UserService } from '../_services/user.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { ChangePasswordDialogComponent } from '../components/change-password-dialog/change-password-dialog.component';
import { EditUserDialogComponent } from '../components/edit-user-dialog/edit-user-dialog.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  @Input() usersList: any = [];
  @Input() rolesList: any = [];
  @Input() accessPermissions: any = [];

  @Output() getUsersList = new EventEmitter<any>();

  displayedColumns: string[] = ['username', 'name', 'email', 'role', 'creationDate', 'actions'];

  /**
   * Specify if the user can change password for the selected user
   */
  public userCanUpdate: boolean = undefined;

  /**
   * Specify if the user can generate "reset password link" for the selected user
   */
  public userCanChange: boolean = undefined;

  /**
   * Specify if the user can lock the selected user
   */
  public userCanLock: boolean = undefined;

  /**
   * Specify if the user can delete the selected user
   */
  public userCanDelete: boolean = undefined;

  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private backendService: BackendService,
    private platformLocation: PlatformLocation) { }

  ngOnInit(): void {

    (async () => {
      while (this.accessPermissions && this.accessPermissions.length === 0)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.accessPermissions && Object.keys(this.accessPermissions.auth).length > 0) {
        this.userCanUpdate = this.accessPermissions.auth.update_user;
        this.userCanChange = this.accessPermissions.auth.impersonate;
        this.userCanLock = this.accessPermissions.auth.jail;
        this.userCanDelete = this.accessPermissions.auth.delete_user;

        this.cdr.detectChanges();
      }
    })();
  }

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
          '/?token=' +
          encodeURIComponent(result.ticket) +
          '&username=' +
          encodeURIComponent(user.username) +
          '&url=' +
          encodeURIComponent(this.backendService.active.url);
        this.clipboard.copy(url);
        this.generalService.showFeedback('Reset password link is copied to your clipboard', 'successMessage', 'Ok', 4000);
      },
      error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)
    });
  }

  getRoles(el: User) {
    return (el.roles || []).join(',');
  }

  /**
   * Invoked when user wants to create a login link for user.
   * @param user Selected user.
   */
  generateLoginLink(user: User) {
    this.userService.generateLoginLink(user.username).subscribe({
      next: (result: AuthenticateResponse) => {
        const location: any = this.platformLocation;
        const url = location.location.origin.toString() + '/authentication/login' +
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
        this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000);
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
        title: `Lock user ${user?.username}`,
        description_extra: 'To proceed please type in the <span class="fw-bold">user\'s username</span> below.',
        action_btn: 'Lock user',
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
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)
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
          error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)
        });
      }
    })
  }

  getExtra (name: string, el: User) {
    const result = el?.extra?.filter(x => x.type === name) || [];
    if (result.length > 0) {
      return result[0].value;
    }
    return '';
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
      width: '700px',
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
