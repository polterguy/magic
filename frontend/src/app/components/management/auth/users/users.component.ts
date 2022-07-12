
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { PlatformLocation } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BackendService } from 'src/app/services/backend.service';
import { EditExtraComponent } from './edit-extra/edit-extra.component';
import { FeedbackService } from '../../../../services/feedback.service';
import { AuthenticateResponse } from '../models/authenticate-response.model';
import { NewUserDialogComponent } from './new-user-dialog/new-user-dialog.component';
import { UserService } from 'src/app/components/management/auth/services/user.service';
import { UserRoles } from 'src/app/components/management/auth/models/user-roles.model';
import { User, User_Extra } from 'src/app/components/management/auth/models/user.model';
import { JailUserDialogComponent } from './jail-user-dialog/jail-user-dialog.component';
import { AuthFilter } from 'src/app/components/management/auth/models/auth-filter.model';
import { ExtraInfoDialogComponent } from './extra-info-dialog/extra-info-dialog.component';
import { AddToRoleDialogComponent } from './add-to-role-dialog/add-to-role-dialog.component';

/**
 * Users component for administrating users in the system.
 */
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*', minHeight: '180px'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class UsersComponent implements OnInit {

  /**
   * Users matching filter as returned from backend.
   */
  users: User[] = [];
  expandedElement: User | null;

  user_extra: User_Extra[] = [];

  /**
   * Number of users matching filter in the backend.
   */
  count: number = 0;

  /**
   * Filter for what items to display.
   */
  filter: AuthFilter = {
    limit: 5,
    offset: 0,
    filter: '',
    order: 'created',
    direction: 'desc',
  };

  /**
   * What columns to display in table.
   */
  displayedColumns: string[] = [
    'username',
    'select'
  ];

  /**
   * Filter form control for filtering users to display.
   */
  filterFormControl: FormControl;

  /**
   * Currently selected users.
   */
  @Input() selectedUsers: User[];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param platformLocation Needed to create login link
   * @param feedbackService Used to display feedback to user
   * @param backendService Needed to create login link
   * @param userService Used to fetch, create, and modify users in the system
   * @param clipboard Needed to put login link for users into clipboard
   * @param dialog Needed to create modal dialogues
   */
  constructor(
    private platformLocation: PlatformLocation,
    private feedbackService: FeedbackService,
    public backendService: BackendService,
    private userService: UserService,
    private clipboard: Clipboard,
    private dialog: MatDialog, 
    private cdr: ChangeDetectorRef ) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getUsers();
      });

    this.getUsers();
  }

  /**
   * Retrieves users from your backend.
   */
  getUsers() {
    this.filter.filter = this.filterFormControl.value;
    this.filter.offset = this.paginator.pageIndex * this.paginator.pageSize;
    this.filter.limit = this.paginator.pageSize;

    this.userService.list(this.filter).subscribe({
      next: (users: User[]) => {
        this.selectedUsers.splice(0, this.selectedUsers.length);
        this.users = users || [];
      },
      error: (error: any) => this.feedbackService.showError(error)});

    this.userService.count(this.filter).subscribe({
      next: (res: Count) => this.count = res.count,
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  clearUserFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when users are paged.
   */
  paged() {
    this.getUsers();
  }

  /**
   * Toggles the details view for a single user.
   * 
   * @param user User to toggle details for
   * @callback getUserExtra To get extra details about the user
   */
  toggleDetails(user: User) {
    if (!user.roles) {
      this.userService.getRoles(user.username).subscribe({
        next: (roles: UserRoles[]) => {
          user.roles = (roles || []).map(x => x.role);
          this.getUserExtra(user.username);
        },
        error: (error: any) => this.feedbackService.showError(error)
      });
    }
  }

  /**
   * Selecting users.
   * @param user User to select.
   * @callback toggleDetails To get the extra details, if is not available.
   */
  toggleUserSelection(user: User) {
    const idx = this.selectedUsers.indexOf(user);
    if (idx > -1) {
      this.selectedUsers.forEach((value: any, index: number) => {
        if (value.username == user.username) this.selectedUsers.splice(index, 1);
      });
    } else {
      this.toggleDetails(user);
      this.selectedUsers.push(user);
    }

  }

  /**
   * Toggles the extra details view for a single user.
   * 
   * @param username User to toggle extra details for
   */
  getUserExtra(username: string) {
    this.userService.getUserExtra(username).subscribe({
      next: (res: any) => {
        this.users.forEach((user: any) => {
          if (res) {
            res.forEach((element: any) => {
              if (user.username === element.user) {
                user['user_extra'] = res;
              } else if (!user.user_extra) {
                user['user_extra'] = [];
              }
            });
          } else {
            if (username === user.username) {
              user['user_extra'] = [];
            }
          }
        })
        this.cdr.detectChanges();
      },
      error: (error: any) => this.feedbackService.showError(error)
    });
  }

  openExtraInfoDialog(user_extra: User_Extra[], action: string, user?: string) {
    this.dialog.open(ExtraInfoDialogComponent, {
      data: {
        extra: user_extra.length !== 0 ? user_extra : [{ user: user, type: '', value: '' }], action: action
      },
      width: '500px'
    })
      .afterClosed().subscribe((result: any) => {
        if (result === 'updated') {
          this.getUsers();
        }
      })
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
  shouldDisplayDetails(user: User) {
    return this.selectedUsers.filter(x => x.username === user.username).length > 0;
  }

  /**
   * Put user's username into clipboard
   * 
   * @param user User to copy
   */
  copyUsername(user: User) {
    this.clipboard.copy(user.username);
    this.feedbackService.showInfoShort('User\s username can be found on your clipboard');
  }

  /**
   * Put user in jail for some time, preventing him or her to access Magic
   * for some specified amount of time.
   * 
   * @param user What user to put in jail
   */
  jailUser(user: User) {
    const dialogRef = this.dialog.open(JailUserDialogComponent, {
      width: '550px',
      data: user
    });
    dialogRef.afterClosed().subscribe((releaseDate: Date) => {
      if (releaseDate) {
        this.userService.imprison(user.username, releaseDate).subscribe({
          next: () => {
            this.feedbackService.showInfoShort('User successfully imprisoned');
            this.getUsers();
          },
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /**
   * Invoked when user's locked status has changed.
   * 
   * @param user User to change lock status of
   */
  lockedChanged(user: User) {
    this.userService.update({
      username: user.username,
      locked: !user.locked
    }).subscribe({
      next: () => {
        user.locked = !user.locked;
        this.feedbackService.showInfo(`User was successfully ${user.locked ? 'locked out of system' : 'released to access the system'}`);
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Removes a role from a user.
   * 
   * @param username Username of user to remove specified role from
   * @param role Name of role to remove from user
   */
  removeRole(user: User, role: string) {
    this.userService.removeRole(user.username, role).subscribe({
      next: () => {
        this.feedbackService.showInfo(`'${role}' role was successfully removed from '${user.username}'`);
        user.roles.splice(user.roles.indexOf(role), 1);
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Edits the specified user
   * 
   * @param user User to edit
   */
  editUser(user: User) {
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '550px',
      data: user
    });
    dialogRef.afterClosed().subscribe((username: string) => {
      if (username) {
        this.feedbackService.showInfo(`'${username}' successfully updated`);
        this.getUsers();
      }
    });
  }

  /**
   * Allows user to add a specific user to a role.
   * 
   * @param user User to edit
   */
  addToRole(user: User) {
    this.dialog.open(AddToRoleDialogComponent, {
      width: '550px',
      data: user
    });
  }

  /**
   * Invoked when user wants to create a login link for user.
   */
  generateLoginLink(user: User) {
    this.userService.generateLoginLink(user.username).subscribe({
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
        this.feedbackService.showInfo('The impersonation link can be found on your clipboard');
      },
      error: (error: any) => this.feedbackService.showError(error)});
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
        this.feedbackService.showInfo('The reset password link can be found on your clipboard');
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Deletes the specified user from backend.
   * 
   * @param user User to delete
   */
  delete(user: User) {
    this.feedbackService.confirm(
      'Please confirm operation',
      `Please confirm that you want to delete the '${user.username}' user`,
      () => {
        this.userService.delete(user.username).subscribe({
          next: () => {
            this.feedbackService.showInfo(`'${user.username}' was successfully deleted`);
            this.getUsers();
          },
          error: (error: any) => this.feedbackService.showError(error)});
    });
  }

  /**
   * Shows the create new user modal dialog.
   */
  createUser() {
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((username: string) => {
      if (username) {
        this.feedbackService.showInfo(`'${username}' successfully created`)
        this.getUsers();
        this.getUserExtra(username);
      }
    });
  }

  /**
   * Removes the specified extra field from the specified user.
   * 
   * @param extra Extra field to remove
   */
  removeExtra(extra: User_Extra) {
    this.userService.deleteExtra(extra.type, extra.user).subscribe({
      next: () => {
        this.feedbackService.showInfo('Extra information removed from user');
        this.getUserExtra(extra.user);
      },
      error: (error: any) => this.feedbackService.showError(error)
    });
  }

  /**
   * Edits a single extra field.
   * 
   * @param extra Extra field to edit
   */
  editExtra(extra: User_Extra) {
    const dialogRef = this.dialog.open(EditExtraComponent, {
      width: '550px',
      data: {
        type: extra.type,
        user: extra.user,
        value: extra.value,
      },
    });
    dialogRef.afterClosed().subscribe((result: User_Extra) => {
      if (result) {
        this.userService.editExtra(result).subscribe({
          next: () => {
            this.feedbackService.showInfo('Extra field successfully updated');
            extra.value = result.value;
          },
          error: (error: any) => this.feedbackService.showError(error)
        });
      }
    });
  }
}
