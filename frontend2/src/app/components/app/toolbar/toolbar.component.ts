
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { Messages } from 'src/app/models/message.model';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { LoginDialogComponent } from 'src/app/components/app/login-dialog/login-dialog.component';

/**
 * Toolbar component for displaying toolbar that allow the
 * user to toggle the navbar.
 */
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param authService Authentication and authorisation HTTP service
   * @param backendService Service to keep track of currently selected backend
   * @param messageService Message service to send messages to other components using pub/sub
   */
  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    public backendService: BackendService,
    private messageService: MessageService) { }

  /**
   * Toggles the navbar.
   */
  public toggleNavbar() {
    this.messageService.sendMessage({
      name: Messages.TOGGLE_NAVBAR
    });
  }

  /**
   * Returns the user's status to caller.
   */
  public getUserStatus() {

    // Verifying user is connected to a backend.
    if (!this.backendService.connected) {
      return 'not connected';
    }

    // Removing schema and port from URL.
    let url = this.backendService.current.url.replace('http://', '').replace('https://', '');
    if (url.indexOf(':')) {
      url = url.substr(0, url.indexOf(':'));
    }

    // Checking if user is authenticated.
    if (this.authService.authenticated) {
      return this.backendService.current.username + '@' + url;
    } else if (this.backendService.connected) {
      return 'anonymous@' + url;
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.authService.roles().join(', ');
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  public login() {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe(() => {
      console.log('Authenticated');
    }, error => {
      this.messageService.sendMessage({
        name: Messages.SHOW_ERROR,
        content: error
      });
    });
  }

  /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.authService.logout(false);
    this.messageService.sendMessage({
      name: Messages.USER_LOGGED_OUT,
    });
  }
}
