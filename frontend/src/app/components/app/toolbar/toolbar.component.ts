
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
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
   * @param router Needed to be able to display context sensitive help
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param authService Authentication and authorisation HTTP service
   * @param backendService Service to keep track of currently selected backend
   * @param messageService Message service to send messages to other components using pub/sub
   * @param feedbackService Needed to show confirm dialog.
   */
  constructor(
    private router: Router,
    private dialog: MatDialog,
    public authService: AuthService,
    public backendService: BackendService,
    private messageService: MessageService,
    private feedbackService: FeedbackService) { }

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
    if (url.indexOf(':') !== -1) {
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
      width: '550px',
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
    let url = '';

    // Figuribng out what video to display.
    switch (route) {

      // Home, configuring Magic video.
      case '':
        video = 'https://www.youtube.com/embed/rtK_Ie9E-cI';
        url = 'https://www.youtube.com/watch?v=rtK_Ie9E-cI';
        break;

      // Auth, administrating users and roles.
      case 'auth':
        video = 'https://www.youtube.com/embed/I91IpNnqk8g';
        url = 'https://www.youtube.com/watch?v=I91IpNnqk8g';
        break;

      // SQL, administrating your databases.
      case 'sql':
        video = 'https://www.youtube.com/embed/NMH87k7Dv6c';
        url = 'https://www.youtube.com/watch?v=NMH87k7Dv6c';
        break;

      // Generator menu item.
      case 'crudifier':
        video = 'https://www.youtube.com/embed/PMETvIk_EKg';
        url = 'https://www.youtube.com/watch?v=PMETvIk_EKg';
        break;

      // Endpoints menu item.
      case 'endpoints':
        video = 'https://www.youtube.com/embed/jwN32Ji6MVE';
        url = 'https://www.youtube.com/watch?v=jwN32Ji6MVE';
        break;

      // Files menu item.
      case 'file-system':
        video = 'https://www.youtube.com/embed/x2_2Uzb7h84';
        url = 'https://www.youtube.com/watch?v=x2_2Uzb7h84';
        break;

      // Evaluator menu item.
      case 'evaluator':
        video = 'https://www.youtube.com/embed/S83qWxBAaNM';
        url = 'https://www.youtube.com/watch?v=S83qWxBAaNM';
        break;

      // Tasks menu item.
      case 'tasks':
        video = 'https://www.youtube.com/embed/BnYr3s69_r0';
        url = 'https://www.youtube.com/watch?v=BnYr3s69_r0';
        break;

      // Crypto menu item.
      case 'crypto':
        video = 'https://www.youtube.com/embed/mfQOTq7rMv4';
        url = 'https://www.youtube.com/watch?v=mfQOTq7rMv4';
        break;

      // Diagnostics menu item.
      case 'diagnostics':
        video = 'https://www.youtube.com/embed/nZ_yrw3MRS4';
        url = 'https://www.youtube.com/watch?v=nZ_yrw3MRS4';
        break;

      // Diagnostics menu item.
      case 'log':
        video = 'https://www.youtube.com/embed/mjqvjy-lqnY';
        url = 'https://www.youtube.com/watch?v=mjqvjy-lqnY';
        break;

      // Diagnostics menu item.
      case 'config':
        video = 'https://www.youtube.com/embed/KkVUQk5eAPg';
        url = 'https://www.youtube.com/watch?v=KkVUQk5eAPg';
        break;
    }

    const dismiss = localStorage.getItem('dismiss-warning');
    if (dismiss === 'true') {

      // Showing modal dialog with video.
      this.dialog.open(ToolbarHelpDialogComponent, {
        width: '617px',
        data: {
          video: video
        }
      });

    } else {

      // Warning user about YouTube's lack of privacy.
      this.feedbackService.confirm(
        'Privacy Warning!',
        `<p>This will open YouTube in an iframe. YouTube is known for violating your privacy. Make sure you understand the implications of this before proceeding.</p>` +
        `<p>Alternatively, you might want to open the video directly in an anonymous browser window. The URL for the video is <a href="${url}">${url}</a> in case you want to watch it in privacy.</p>` +
        '<p>Do you wish to proceed anyway?</p>',
        () => {

          // Storing preferences for displaying warning.
          localStorage.setItem('dismiss-warning', 'true');

          // Showing modal dialog with video.
          this.dialog.open(ToolbarHelpDialogComponent, {
            width: '625px',
            data: {
              video: video
            }
          });
      });
    }
  }
}
