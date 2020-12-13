
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { User } from 'src/app/models/user.model';
import { Count } from 'src/app/models/count.model';
import { BaseComponent } from '../../base.component';
import { Affected } from 'src/app/models/affected.model';
import { UserService } from 'src/app/services/user.service';
import { AuthFilter } from 'src/app/models/auth-filter.model';
import { MessageService } from 'src/app/services/message.service';
import { NewUserDialogComponent } from './new-user-dialog/new-user-dialog.component';

/**
 * Users component for administrating users in the system.
 */
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent extends BaseComponent implements OnInit {

  // List of usernames we're currently viewing details for.
  private displayDetails: User[] = [];

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
  };

  /**
   * What columns to display in table.
   */
  public displayedColumns: string[] = [
    'username'
  ];

  /**
   * Filter form control for filtering users to display.
   */
  public filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Material dialog used for opening up Load snippets modal dialog
   * @param userService Used to fetch, create, and modify users in the system
   * @param messageService Message service to subscribe and publish messages to and from other components
   */
  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    protected messageService: MessageService) {
    super(messageService);
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.getUsers());

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
      this.displayDetails = [];
      this.users = users;
    }, (error: any) => this.showError(error));

    // Invoking backend to retrieve count of user matching filter condition.
    this.userService.count(this.filter).subscribe((res: Count) => {
      this.count = res.count;
    }, (error: any) => this.showError(error));
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  public clearUserFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when users are paged.
   * 
   * @param e Paged event object
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
    const idx = this.displayDetails.indexOf(user);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(user);
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
  public shouldDisplayDetails(user: User) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x.username === user.username).length > 0;
  }

  /**
   * Deletes the specified user from backend.
   * 
   * @param user User to delete
   */
  public delete(user: User) {

    // Invoking backend to delete user.
    this.userService.delete(user.username).subscribe((affected: Affected) => {
      this.showInfo('User deleted');
      this.getUsers();
    });
  }

  /**
   * Shows the create new user modal dialog.
   */
  public createUser() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe((username: string) => {

      // Checking if modal dialog wants to create a user.
      if (username) {

        // User was created.
        this.showInfo(`'${username}' successfully created`)
        this.getUsers();
      }
    });
  }
}
