
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { User } from 'src/app/models/user.model';
import { BaseComponent } from '../base.component';
import { UserService } from 'src/app/services/user.service';
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

  /**
   * What columns to display in table.
   */
  public displayedColumns: string[] = [
    'username'
  ];

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

    // Retrieving users from backend.
    this.userService.list().subscribe((users: User[]) => {
      this.users = users;
    }, (error: any) => this.showError(error));
  }
}
