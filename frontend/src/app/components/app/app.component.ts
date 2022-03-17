
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { Messages } from 'src/app/models/messages.model';
import { AuthService } from 'src/app/services/auth.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BazarService } from '../../services/management/bazar.service';
import { DiagnosticsService } from '../../services/diagnostics.service';
import { ConfigService } from '../../services/management/config.service';

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

  /**
   * To get the width of the screen 
   * getScreenWidth {number} :: define how the sidenav and the content should behave based on the screen size
   * smallScreenSize {number} :: to set a fixed size as an agreement
   * notSmallScreen {boolean} :: to check whether the screen width is small or large
   */
  getScreenWidth: number;
  smallScreenSize: number = 768;
  notSmallScreen: boolean = undefined;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.notSmallScreen = (this.getScreenWidth > this.smallScreenSize || this.getScreenWidth === this.smallScreenSize) ? true : false;
    this.sidenavOpened = this.notSmallScreen;
  }

  /**
   * True if navigation menu is expanded.
   */
  sidenavOpened: boolean;

  /**
   * If there exists a newer version of Magic Core as published by the Bazar,
   * this value will be true.
   */
  shouldUpdateCore: boolean = false;
   
  /**
   * Backend version as returned from server if authenticated.
   */
  version: string = null;

   /**
    * Latest version of Magic as published by the Bazar.
    */
  bazarVersion: string = null;

  /**
   * CSS class wrapping entire application.
   * 
   * Used to change theme dynamically, and invert colors between 'light' and 'dark' themes.
   */
  theme: string = 'light';

  /**
   * Creates an instance of your component.
   * 
   * @param router Router service used to redirect user to main landing page if he logs out
   * @param snackBar Snack bar used to display feedback to user, such as error or information
   * @param messageService Message service to allow for cross component communication using pub/sub pattern
   * @param authService Authentication and authorisation service, used to authenticate user, etc
   * @param backendService Needed toverify we'reactuallyconnected to some backend before retrieving endpoints
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param bazarService Needed to see if there exists a newer version to install
   * @param configService Needed to check if system has been initially configured
   * @param feedbackService Needed to provide feedback to user
   * @param diagnosticsService Needed to retrieve backend version
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   */
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private messageService: MessageService,
    public authService: AuthService,
    private backendService:BackendService,
    public loaderService: LoaderService,
    private bazarService: BazarService,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    private diagnosticsService: DiagnosticsService,
    private overlayContainer: OverlayContainer) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.checkStatus();
    this.authService.authenticatedChanged.subscribe(() => {
      this.checkStatus();
    });

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
            this.feedbackService.showInfo('You were successfully logged out of your backend');
          }

          // Redirecting user to landing page.
          if (this.router.url !== '/') {
            this.router.navigate(['/']);
          }
          this.backendService.active.createAccessRights();
          break;

        // User was logged in.
        case Messages.USER_LOGGED_IN:
          this.feedbackService.showInfo('You were successfully authenticated towards your backend');
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
  ngOnDestroy() {
    this.subscriber.unsubscribe();
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.sidenavOpened = false;
  }

  /*
   * Private helper methods.
   */

  /*
   * Checks setup status of system if user is authenticated and in root role,
   * and if system is not yet configured, redirects to '/config' route.
   */
  private checkStatus() {
    if (this.backendService.active?.token?.in_role('root')) {
      this.configService.status().subscribe(config => {
        this.configService.changeStatus(config.config_done && config.magic_crudified && config.server_keypair);
        if (!config.config_done || !config.magic_crudified || !config.server_keypair) {
          this.router.navigate(['/config']);
        }
      });
    }
  }
  
  /*
   * Retrieves backend version.
   */
  private retrieveBackendVersion() {
    if (this.backendService.active?.token?.in_role('root')) {
      this.diagnosticsService.version().subscribe((version: any) => {
        this.version = version.version;
        this.bazarService.latestVersion().subscribe((result: Response) => {
          this.bazarVersion = result.result;
          if (this.bazarVersion !== this.version) {

            // TODO: Replace service invocation with some sort of method in service or something.
            this.configService.versionCompare(this.bazarVersion, this.version).subscribe((result: Response) => {
              if (+result.result === 1) {
                this.feedbackService.showInfo('There has been published an updated version of Magic. You should probably update your current version.');
                this.shouldUpdateCore = true;
              }
            });
          }

        }, (error: any) => this.feedbackService.showError(error));
      }, (error: any) => {
        this.feedbackService.showError(error);
      });

    } else {
      this.version = '';
    }
  }
}
