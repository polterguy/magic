
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Application specific imports.
import { Message, Messages } from 'src/app/models/message.model';
import { AuthService } from 'src/app//services/auth.service';
import { LoaderService } from 'src/app/services/loader-service';
import { MessageService } from 'src/app/services/message-service';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { Router } from '@angular/router';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  private subscriber: Subscription;
  public sidenavOpened = false;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param snackBar Snack bar used to display feedback to user, such as error or information
   * @param messageService Message service to allow for cross component communication using pub/sub pattern
   * @param router Router service used to redirect user according to business logic flow
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param authService Authentication and authorisation service, used to authenticate user, etc
   */
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private messageService: MessageService,
    private router: Router,
    public loaderService: LoaderService,
    public authService: AuthService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {

      switch(msg.name) {

        case Messages.LOGGED_OUT:
          this.showInfo('You were successfully logged out of your backend');
          break;

        case Messages.LOGGED_IN:
          this.showInfo('You were successfully authenticated towards your backend');
          break;

        case Messages.ERROR:
          this.showError(msg.content);
          break;

        case Messages.INFO:
          this.showInfo(msg.content);
          break;

        case Messages.INFO_SHORT:
          this.showInfo(msg.content, 2000);
          break;
        }
    });

    this.authService.getEndpoints().subscribe(res => {
      console.log('Endpoints authorisation objects retrieved');
    }, error => {
      this.showError(error);
    });
  }

  /**
   * OnDestroy implementation.
   */
  public ngOnDestroy() {
    this.subscriber.unsubscribe();
  }

  /**
   * Toggles the navbar.
   */
  public toggleNavbar() {
    this.sidenavOpened = !this.sidenavOpened;
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
      this.showError(error);
    });
  }

  /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.authService.logout(false);
    this.messageService.sendMessage({
      name: Messages.LOGGED_OUT,
    });
  }

  /**
   * Returns the user's status to caller.
   */
  public getUserStatus() {
    if (this.authService.authenticated) {
      let url = this.authService.current.url.replace('http://', '').replace('https://', '');
      if (url.indexOf(':')) {
        url = url.substr(0, url.indexOf(':'));
      }
      return this.authService.current.username + '@' + url;
    } else if (this.authService.connected) {
      let url = this.authService.current.url.replace('http://', '').replace('https://', '');
      if (url.indexOf(':')) {
        url = url.substr(0, url.indexOf(':'));
      }
      return 'anonymous@' + url;
    } else {
      return 'Not connected'
    }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.authService.roles().join(', ');
  }

  /**
   * Returns true if user has access to currently loaded component.
   */
  public hasAccessToCurrentComponent() {
    const segments = this.router.url.split('/');
    if (segments.filter(x => x === '').length === 2) {
      return true; // Home component
    }
    return this.authService.hasAccess('magic/modules/system/' + segments[1]);
  }

  /*
   * Private helper methods.
   */

  /*
   * Common method for displaying errors in the application.
   */
  private showError(error: any) {
    this.snackBar.open(error.error?.message || error, null, {
      duration: 5000,
    });
  }

  /*
   * Common method for displaying information to the end user.
   */
  private showInfo(info: string, duration: number = 5000) {
    this.snackBar.open(info, null, {
      duration,
    });
  }
}
