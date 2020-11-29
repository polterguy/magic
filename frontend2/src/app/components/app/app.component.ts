
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
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param authService Authentication and authorisation service, used to authenticate user, etc
   */
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private messageService: MessageService,
    public loaderService: LoaderService,
    public authService: AuthService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {

      switch(msg.name) {

        case Messages.ERROR:
          this.showError(msg.content);
          break;

        case Messages.INFO:
          this.showInfo(msg.content);
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
      width: '350px',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    }, error => {
      this.showError(error);
    });
  }

  /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.authService.logout(false);
  }

  /**
   * Returns the user's status to caller.
   */
  public getUserStatus() {
    if (this.authService.authenticated) {
      return this.authService.current.username +
        '@' +
        this.authService.current.url.replace('http://', '').replace('https://', '');
    } else if (this.authService.connected) {
      return 'anonymous@' + this.authService.current.url.replace('http://', '').replace('https://', '');
    } else {
      return 'Not connected'
    }
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
  private showInfo(info: string) {
    this.snackBar.open(info, null, {
      duration: 5000,
    });
  }
}
