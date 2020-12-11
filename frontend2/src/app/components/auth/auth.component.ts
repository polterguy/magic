
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { User } from 'src/app/models/user.model';
import { BaseComponent } from '../base.component';
import { UserService } from 'src/app/services/user.service';
import { AuthFilter } from 'src/app/models/auth-filter.model';
import { MessageService } from 'src/app/services/message.service';

/**
 * Authentication and authorization component, allowing you to administrate and manage
 * your roles and users in your Magic backend.
 */
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent extends BaseComponent implements OnInit {

  /**
   * Data for users table.
   */
  public users: User[] = [];

  public filter: AuthFilter = {
    limit: 20,
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
   * Creates an instance of your component.
   * 
   * @param messageService Message service to subscribe and publish messages to and from other components
   */
  constructor(
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
        this.getUsers(query);
      });

    // Retrieving users from backend.
    this.getUsers(this.filterFormControl.value);
  }

  /**
   * Retrieves users from your backend.
   */
  public getUsers(filter: string) {

    // Updating filter value.
    this.filter.filter = filter;

    // Invoking backend.
    this.userService.list(this.filter).subscribe((users: User[]) => {

      // Assigning users, triggering a re-render operation of the material table.
      this.users = users;

    }, (error: any) => this.showError(error));
  }

  /**
   * Clears any filters user has applied for the users table.
   */
  public clearUserFilter() {
    this.filterFormControl.setValue('');
  }
}
