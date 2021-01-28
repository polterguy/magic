
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { AuthService } from 'src/app/components/auth/services/auth.service';
import { LoginDialogComponent } from 'src/app/components/app/login-dialog/login-dialog.component';
import { ToolbarHelpDialogComponent } from './toolbar-help-dialog/toolbar-help-dialog.component';

/**
 * Toolbar component for displaying toolbar that allows the
 * user to toggle the navbar, and login/logout of Magic.
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
   * @param router Needed to be able to display context sensitive help
   * @param messageService Message service to send messages to other components using pub/sub
   */
  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    public backendService: BackendService,
    private router: Router,
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
    this.dialog.open(LoginDialogComponent, {
      width: '400px',
    });
  }

  /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.authService.logout(false);
  }

  /**
   * Invoked when usert clicks the help icon.
   */
  public help() {

    // Retrieving currently activated route, which is component.
    const route = this.router.url.split('/')[1];
    let video = '';
    switch (route) {
      case '':
        video = 'https://www.youtube.com/embed/rtK_Ie9E-cI';
        break;
    }

    // Showing modal dialog with video.
    this.dialog.open(ToolbarHelpDialogComponent, {
      width: '625px',
      data: {
        video: video
      }
    });
  }
}
