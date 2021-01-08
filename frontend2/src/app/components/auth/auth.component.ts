
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { User } from 'src/app/components/auth/models/user.model';

/**
 * Authentication and authorization component, allowing you to administrate and manage
 * your roles and users in your Magic backend.
 */
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {

  /**
   * Users that are selected in the users component.
   */
  public selectedUsers: User[] = [];
}
