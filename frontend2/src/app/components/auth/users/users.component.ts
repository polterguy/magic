
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
      .subscribe((query: string) => {
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

    // Invoking backend.
    this.userService.list(this.filter).subscribe((users: User[]) => {
      this.users = users;
    }, (error: any) => this.showError(error));

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
  public paged(e: PageEvent) {
    this.getUsers();
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
      if (username) {
        this.filterFormControl.setValue(username);
        this.getUsers();
      }
    });
  }
}
