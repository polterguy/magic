
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { AuthService } from 'src/app//services/auth.service';
import { LoaderService } from 'src/app/services/loader-service';
import { Message, Messages } from 'src/app/models/message.model';
import { MessageService } from 'src/app/services/message-service';

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
   * @param router Router service used to read currently loaded router URL
   * @param snackBar Snack bar used to display feedback to user, such as error or information
   * @param messageService Message service to allow for cross component communication using pub/sub pattern
   * @param authService Authentication and authorisation service, used to authenticate user, etc
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   */
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private messageService: MessageService,
    public authService: AuthService,
    public loaderService: LoaderService) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    /*
     * Subscribing to relevant messages published by other components
     * when wire frame needs to react to events occurring other places in our app.
     */
    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {

      switch(msg.name) {

        // User was logged out
        case Messages.USER_LOGGED_OUT:
          this.showInfo('You were successfully logged out of your backend');
          break;

        // User was logged in
        case Messages.USER_LOGGED_IN:
          this.showInfo('You were successfully authenticated towards your backend');
          break;

        // Some error occurred and we need to display it to the user
        case Messages.SHOW_ERROR:
          this.showError(msg.content);
          break;

        // Some component wants to show user some information
        case Messages.SHOW_INFO:
          this.showInfo(msg.content);
          break;

        // Some component wants to show user some 'short' information
        case Messages.SHOW_INFO_SHORT:
          this.showInfo(msg.content, 2000);
          break;

        // Some component wants to toggle the navbar
        case Messages.TOGGLE_NAVBAR:
          this.sidenavOpened = !this.sidenavOpened;
          break;

        // Some component wants to close the navbar
        case Messages.CLOSE_NAVBAR:
          this.sidenavOpened = false;
          break;
      }
    });

    // Retrieving all endpoints from backend
    this.authService.getEndpoints().subscribe(res => {
      console.log('Endpoints authorisation objects retrieved');
    }, error => {
      this.showError(error);
    });
  }

  /**
   * OnDestroy implementation.
   * 
   * Needed to unsubscribe to subscription registered in OnInit.
   */
  public ngOnDestroy() {
    this.subscriber.unsubscribe();
  }

  /**
   * Closes the navbar.
   */
  public closeNavbar() {
    this.sidenavOpened = false;
  }

  /**
   * Returns true if user has access to currently loaded component.
   */
  public hasAccess() {
    if (this.router.url === '/') {
      return true; // Home component, everybody has access to this somehow.
    }

    /*
     * Assuming the component's router URL is equal to the backend URL(s)
     * invoked when component's data is somehow read or modified.
     */
    const segments = this.router.url.split('/');
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
