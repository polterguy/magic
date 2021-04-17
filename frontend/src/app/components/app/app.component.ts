
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Messages } from 'src/app/models/messages.model';
import { MessageService } from 'src/app/services/message.service';
import { AuthService } from 'src/app/components/auth/services/auth.service';
import { LoaderService } from 'src/app/components/app/services/loader.service';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  // Needed to subscribe to messages published by other componentsd.
  private subscriber: Subscription;

  /**
   * True if navigation menu is expanded.
   */
  public sidenavOpened = false;

  /**
   * CSS class wrapping entire application.
   * 
   * Used to change theme dynamically, and invert colors between 'light' and 'dark' themes.
   */
  public theme: string;

  /**
   * Creates an instance of your component.
   * 
   * @param router Router service used to redirect user to main landing page if he logs out
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

        // User was logged out.
        case Messages.USER_LOGGED_OUT:

          // Verifying caller wants to display information to user or not.
          if (msg.content !== false) {
            this.showInfo('You were successfully logged out of your backend');
          }

          // Redirecting user to landing page.
          if (this.router.url !== '/') {
            this.router.navigate(['/']);
          }
          break;

        // User was logged in.
        case Messages.USER_LOGGED_IN:
          this.showInfo('You were successfully authenticated towards your backend');
          break;

        // Theme was changed.
        case Messages.THEME_CHANGED:
          this.theme = msg.content;
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
