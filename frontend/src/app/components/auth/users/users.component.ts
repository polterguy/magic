
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { PlatformLocation } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { BackendService } from 'src/app/services/backend.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Component, Input, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Affected } from 'src/app/models/affected.model';
import { User } from 'src/app/components/auth/models/user.model';
import { FeedbackService } from '../../../services/feedback.service';
import { UserService } from 'src/app/components/auth/services/user.service';
import { UserRoles } from 'src/app/components/auth/models/user-roles.model';
import { AuthenticateResponse } from '../models/authenticate-response.model';
import { AuthFilter } from 'src/app/components/auth/models/auth-filter.model';
import { NewUserDialogComponent } from './new-user-dialog/new-user-dialog.component';
import { JailUserDialogComponent } from './jail-user-dialog/jail-user-dialog.component';
import { AddToRoleDialogComponent } from './add-to-role-dialog/add-to-role-dialog.component';

/**
 * Users component for administrating users in the system.
 */
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  /**
   * Users matching filter as returned from backend.
   */
  public users: User[] = [];

  /**
   * Number of users matching filter in the backend.
   */
  public count: number = 0;

  /**
   * Filter for what items to display.
   */
  public filter: AuthFilter = {
    limit: 5,
    offset: 0,
    filter: '',
    order: 'created',
    direction: 'desc',
  };

  /**
   * What columns to display in table.
   */
  public displayedColumns: string[] = [
    'username',
  ];

  /**
   * Filter form control for filtering users to display.
   */
  public filterFormControl: FormControl;

  /**
   * Currently selected users.
   */
  @Input() public selectedUsers: User[];

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

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
    private backendService: BackendService,
    private userService: UserService,
    private clipboard: Clipboard,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.pageIndex = 0;
        this.getUsers();
      });

    // Retrieving users from backend.
    this.getUsers();
  }

  /**
   * Retrieves users from your backend.
   */
  public getUsers() {

    // Updating filter value.
    this.filter.filter = this.filterFormControl.value;
    this.filter.offset = this.paginator.pageIndex * this.paginator.pageSize;
    this.filter.limit = this.paginator.pageSize;

    // Invoking backend to retrieve users matching filter.
    this.userService.list(this.filter).subscribe((users: User[]) => {

      // Unselecting all selected users.
      this.selectedUsers.splice(0, this.selectedUsers.length);

      // Assigning model to results of backend invocation.
      this.users = users || [];

    }, (error: any) => this.feedbackService.showError(error));

    // Invoking backend to retrieve count of user matching filter condition.
    this.userService.count(this.filter).subscribe((res: Count) => {

      // Assinging model to result of backend invocation.
      this.count = res.count;

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  public clearUserFilter() {
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when users are paged.
   */
  public paged() {
    this.getUsers();
  }

  /**
   * Toggles the details view for a single user.
   * 
   * @param user User to toggle details for
   */
  public toggleDetails(user: User) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedUsers.indexOf(user);
    if (idx !== -1) {

      // Hiding item.
      this.selectedUsers.splice(idx, 1);
    } else {

      // Displaying item.
      this.selectedUsers.push(user);

      // Fetching roles for user.
      this.userService.getRoles(user.username).subscribe((roles: UserRoles[]) => {

        // Applying roles to user model
        user.roles = (roles || []).map(x => x.role);
      });
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
  public shouldDisplayDetails(user: User) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedUsers.filter(x => x.username === user.username).length > 0;
  }

  /**
   * Put user's username into clipboard
   * 
   * @param user User to copy
   */
  public copyUsername(user: User) {

    // Adding username to clipboard and providing some feedback to user.
    this.clipboard.copy(user.username);
    this.feedbackService.showInfoShort('User\s username can be found on your clipboard');
  }

  /**
   * Put user in jail for some time, preventing him or her to access Magic
   * for some specified amount of time.
   * 
   * @param user What user to put in jail
   */
  public jailUser(user: User) {

    // Creating modal dialogue that asks user for how much time the specified user should be imprisoned.
    const dialogRef = this.dialog.open(JailUserDialogComponent, {
      width: '550px',
      data: user
    });

    dialogRef.afterClosed().subscribe((releaseDate: Date) => {

      // Checking if modal dialog wants to jail the user.
      if (releaseDate) {

        /*
         * User was jailed, invoking backend to make sure user
         * cannot access Magic before release date.
         */
        this.userService.imprison(user.username, releaseDate).subscribe(() => {

          // Giving user feedback, and re-fetching all users again.
          this.feedbackService.showInfoShort('User successfully imprisoned');
          this.getUsers();

        }, (error: any) => this.feedbackService.showError(error));
      }
    });
  }

  /**
   * Invoked when user's locked status has changed.
   * 
   * @param user User to change lock status of
   */
  lockedChanged(user: User) {

    // Invoking backend to update user's locked status.
    this.userService.update({
      username: user.username,
      locked: !user.locked
    }).subscribe(() => {

      // Updating model and showing some information to user.
      user.locked = !user.locked;
      this.feedbackService.showInfo(`User was successfully ${user.locked ? 'locked out of system' : 'released to access the system'}`);

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Removes a role from a user.
   * 
   * @param username Username of user to remove specified role from
   * @param role Name of role to remove from user
   */
  public removeRole(user: User, role: string) {

    // Invoking backend to remove role from user.
    this.userService.removeRole(user.username, role).subscribe((affected: Affected) => {

      // Success, informing user operation was successful.
      this.feedbackService.showInfo(`'${role}' role was successfully removed from '${user.username}'`);

      // No need to invoke backend.
      user.roles.splice(user.roles.indexOf(role), 1);
    });
  }

  /**
   * Edits the specified user
   * 
   * @param user User to edit
   */
  public editUser(user: User) {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '550px',
      data: user
    });

    dialogRef.afterClosed().subscribe((username: string) => {

      // Checking if modal dialog wants to create a user.
      if (username) {

        // User was created.
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
   public addToRole(user: User) {

    // Showing modal dialog.
    this.dialog.open(AddToRoleDialogComponent, {
      width: '550px',
      data: user
    });
  }

  /**
   * Invoked when user wants to create a login link for user.
   */
  public generateLoginLink(user: User) {

    // Creates a login link by invoking backend.
    this.userService.generateLoginLink(user.username).subscribe((result: AuthenticateResponse) => {

      // Creating an authentication URL, and putting it on the clipboard, giving user some feedback in the process.
      const location: any = this.platformLocation;
      const url = location.location.origin.toString() +
        '/?token=' +
        encodeURIComponent(result.ticket) +
        '&username=' +
        encodeURIComponent(user.username) +
        '&url=' +
        encodeURIComponent(this.backendService.current.url);

      this.clipboard.copy(url);
      this.feedbackService.showInfo('The impersonation link can be found on your clipboard');

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to create a reset password link for a specific user.
   * 
   * @param user User to create link for
   */
  public generateResetPasswordLink(user: User) {

    // Creates a login link by invoking backend.
    this.userService.generateResetPasswordLink(user.username).subscribe((result: AuthenticateResponse) => {

      // Creating an authentication URL, and putting it on the clipboard, giving user some feedback in the process.
      const location: any = this.platformLocation;
      const url = location.location.origin.toString() +
        '/?token=' +
        encodeURIComponent(result.ticket) +
        '&username=' +
        encodeURIComponent(user.username) +
        '&url=' +
        encodeURIComponent(this.backendService.current.url);

      this.clipboard.copy(url);
      this.feedbackService.showInfo('The reset password link can be found on your clipboard');

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Deletes the specified user from backend.
   * 
   * @param user User to delete
   */
  public delete(user: User) {

    // Asking user to confirm deletion.
    this.feedbackService.confirm(
      'Please confirm operation',
      `Please confirm that you want to delete the '${user.username}' user`,
      () => {

        // Invoking backend to delete user.
        this.userService.delete(user.username).subscribe(() => {

          // Success, makins sure we databind table again by invoking backend to retrieve current users.
          this.feedbackService.showInfo(`'${user.username}' was successfully deleted`);
          this.getUsers();

        }, (error: any) => this.feedbackService.showError(error));
    });
  }

  /**
   * Shows the create new user modal dialog.
   */
  public createUser() {

    // Showing modal dialog allowing user to create a new user.
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe((username: string) => {

      // Checking if modal dialog wants to create a user.
      if (username) {

        // User was created.
        this.feedbackService.showInfo(`'${username}' successfully created`)
        this.getUsers();
      }
    });
  }
}
