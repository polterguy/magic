
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { Messages } from 'src/app/models/messages.model';
import { BazarService } from '../management/bazar/services/bazar.service';
import { ConfigService } from '../management/config/services/config.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AuthService } from 'src/app/components/management/auth/services/auth.service';
import { LoaderService } from 'src/app/components/app/services/loader.service';
import { DiagnosticsService } from '../../services/diagnostics.service';
import { OverlayContainer } from '@angular/cdk/overlay';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  /**
   * To get the width of the screen 
   * getScreenWidth {number} :: define how the sidenav and the content should behave based on the screen size
   * smallScreenSize {number} :: to set a fixed size as an agreement
   * notSmallScreen {boolean} :: to check whether the screen width is small or large
   */
  public getScreenWidth: number;
  public smallScreenSize: number = 768;
  public notSmallScreen: boolean = undefined;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.notSmallScreen = (this.getScreenWidth > this.smallScreenSize || this.getScreenWidth === this.smallScreenSize) ? true : false;
    this.sidenavOpened = this.notSmallScreen;
  }

  // Needed to subscribe to messages published by other componentsd.
  private subscriber: Subscription;

  /**
   * True if navigation menu is expanded.
   */
  public sidenavOpened: boolean;

  /**
   * If there exists a newer version of Magic Core as published by the Bazar,
   * this value will be true.
   */
  public shouldUpdateCore: boolean = false;
   
  /**
   * Backend version as returned from server if authenticated.
   */
  public version: string = null;

   /**
    * Latest version of Magic as published by the Bazar.
    */
  public bazarVersion: string = null;

  /**
   * CSS class wrapping entire application.
   * 
   * Used to change theme dynamically, and invert colors between 'light' and 'dark' themes.
   */
  public theme: string = 'light';

  /**
   * Creates an instance of your component.
   * 
   * @param router Router service used to redirect user to main landing page if he logs out
   * @param snackBar Snack bar used to display feedback to user, such as error or information
   * @param messageService Message service to allow for cross component communication using pub/sub pattern
   * @param authService Authentication and authorisation service, used to authenticate user, etc
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param messageService Needed to subscribe to messages informing us when user logs in and out
   * @param diagnosticsService Needed to retrieve backend version
   * @param feedbackService Needed to provide feedback to user
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   */
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private messageService: MessageService,
    public authService: AuthService,
    public loaderService: LoaderService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    private diagnosticsService: DiagnosticsService,
    private overlayContainer: OverlayContainer) { }
  /**
   * OnInit implementation.
   */
  public ngOnInit() {
    // check authentication state
    (async () => {
      while (!this.authService.authenticated)
        await new Promise(resolve => setTimeout(resolve, 100));

        /**
         * if the user IS authenticated
         * ** then check if db configuration is defined or not
         * *** if is not defined then get the status and pass to other components
         */
      if (this.authService.authenticated) {
        let definedStatus: boolean;
        this.configService.configStatus.subscribe(status => { definedStatus = status });
        if (definedStatus === undefined) {

          this.configService.status().subscribe(config => {
            this.configService.changeStatus(config.config_done && config.magic_crudified && config.server_keypair);

            // If there are remaining setup steps we redirect to config component.
            if (!config.config_done || !config.magic_crudified || !config.server_keypair) {
              this.router.navigate(['/config']);
            }
          });
        }
      }
    })();

    /**
     * to check the screen width rule for initial setting
     */
    this.onWindowResize();

    // Attempting to retrieve backend version.
    // this.retrieveBackendVersion();
    /*
     * Subscribing to relevant messages published by other components
     * when wire frame needs to react to events occurring other places in our app.
     */
    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === Messages.USER_LOGGED_IN || msg.name === Messages.USER_LOGGED_OUT) {
        this.retrieveBackendVersion();
      }
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
          this.authService.createAccessRights();
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
          localStorage.setItem('sidebar', this.sidenavOpened ? 'open' : 'close');
          break;

        // Some component wants to close the navbar
        case Messages.CLOSE_NAVBAR:
          this.sidenavOpened = false;
          localStorage.setItem('sidebar', 'close');
          break;
      }
    });

    // Retrieving all endpoints from backend
    this.authService.getEndpoints().subscribe(res => {
      ; // Do nothing ...
    }, error => {
      this.showError(error);
    });

    // wait until sidebar status is defined based on the value stored in localstorage 
    (async () => {
      while (this.sidenavOpened === undefined)
        await new Promise(resolve => setTimeout(resolve, 100));

      this.sidenavOpened = !localStorage.getItem('sidebar') && this.notSmallScreen ? true : (localStorage.getItem('sidebar') === 'open' && this.notSmallScreen ? true : false);

      // wait until theme color is defined based on the value stored in localstorage 
      if (!localStorage.getItem('theme')) {
        this.theme = 'light';
      } else {
        this.theme = localStorage.getItem('theme');
      }
      this.overlayContainer.getContainerElement().classList.add(this.theme);

      this.messageService.sendMessage({
        name: Messages.THEME_CHANGED,
        content: this.theme,
      });
    })();
    
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
   * Toggles the navbar.
   */
  public toggleNavbar() {

    // Publishing message to inform other components that navbar was toggled.
    this.messageService.sendMessage({
      name: Messages.TOGGLE_NAVBAR
    });
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
  
  /*
   * Retrieves backend version.
   */
  private retrieveBackendVersion() {

    // Retrieving backend version if we're authenticated.
    if (this.authService.isRoot) {

      // Invoking backend to retrieve version.
      this.diagnosticsService.version().subscribe((version: any) => {

        // Assigning model.
        this.version = version.version;

        // Invoking Bazar to check if we have the latest current version of Magic installed.
        this.bazarService.version().subscribe((result: Response) => {

          // Assigning model.
          this.bazarVersion = result.result;

          // Checking if Bazar version differs from current version.
          if (this.bazarVersion !== this.version) {

            // Invoking backend to check if Bazar version of Magic is higher than current version of Magic.
            this.configService.versionCompare(this.bazarVersion, this.version).subscribe((result: Response) => {

              /*
               * Checking return value of invocation, and if it was +1, the Bazar
               * claims there exists a newer version of the core.
               */
              if (+result.result === 1) {

                // Newer version exists according to Bazar.
                this.feedbackService.showInfo('There has been published an updated version of Magic. You should probably update your current version.');
                this.shouldUpdateCore = true;
              }
            });
          }

        }, (error: any) => this.feedbackService.showError(error));

      }, (error: any) => {
        this.authService.logout(false, false);
      });

    } else {

      // Unknown backend version since we're obviously not connected to any backend.
      this.version = '';
    }
  }
}
