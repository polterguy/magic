
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Messages } from 'src/app/models/messages.model';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { AuthService } from 'src/app/components/auth/services/auth.service';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

/**
 * Component wrapping navbar.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @Input() sideNavStatus: boolean;

  /**
   * True if user wants to use light theme, otherwise false.
   */
  public lightTheme: string;

  /**
   * Creates an instance of your component.
   * 
   * @param authService Authentication and authorisation HTTP service
   * @param messageService Message service to send messages to other components using pub/sub
   * @param backendService Service to keep track of currently selected backend
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   */
  constructor(
    public authService: AuthService,
    private messageService: MessageService,
    public backendService: BackendService,
    private dialog: MatDialog,
    private overlayContainer: OverlayContainer) { }


  ngOnInit(): void {
    this.lightTheme = localStorage.getItem('theme');
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
      return this.backendService.current.username + ' / ' + url;
    } else if (this.backendService.connected) {
      return 'anonymous / ' + url;
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.authService.roles().join(', ');
  }

  /**
   * Invoked when theme is changed.
   */
   public themeChanged(value: string) {
     this.lightTheme = value;
     
    // removing previously added class for dialogs
    this.overlayContainer.getContainerElement().classList.remove(localStorage.getItem('theme'));

    // Publishing message informing other components that active theme was changed.
    this.messageService.sendMessage({
      name: Messages.THEME_CHANGED,
      content: value,
    });

    // Persisting active theme to local storage.
    localStorage.setItem('theme', value);

    // setting new class based on the theme for dialogs
    this.overlayContainer.getContainerElement().classList.add(value);
  }

  /**
   * Closes the navbar.
   */
  public closeNavbar() {
    this.messageService.sendMessage({
      name: Messages.CLOSE_NAVBAR
    });
  }

  /**
   * to open documentation in a new tab
   */
  public navigateToDocumentation() {
    window.open(
      "https://docs.aista.com/", "_blank");
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
}
