
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { DiagnosticsService } from '../../../services/diagnostics.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../../services/management/config.service';
import { BazarService } from '../../../services/management/bazar.service';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Location } from '@angular/common'; 
import { Backend } from 'src/app/models/backend.model';

/**
 * Component wrapping navbar.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {

  public backendIsConfigured: boolean = undefined;

  public currentYear: number;

  currentBackend: string;

  /**
   * storing list of backends from localstorage
   */
  public listOfBackends: any = [];

  /**
   * get navbar state as an input from app component
   */
  @Input() sideNavStatus: boolean;

  /**
   * get the screen size
   */
  @Input() notSmallScreen: boolean;

  /**
   * value for the theme, default is set to light
   */
  public theme: string;

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
   * Creates an instance of your component.
   * 
   * @param activated Needed to retrieve query parameters
   * @param router Needed to redirect user after having verified his authentication token
   * @param authService Authentication and authorisation HTTP service
   * @param messageService Message service to send messages to other components using pub/sub
   * @param backendService Service to keep track of currently selected backend
   * @param dialog Dialog reference necessary to show login dialog if user tries to login
   * @param diagnosticsService Needed to retrieve backend version
   * @param feedbackService Needed to provide feedback to user
   * @param configService Needed to check configuration status ofbackend
   * @param bazarService Needed to check if core has update
   * @param overlayContainer Needed to add/remove theme's class name from this component.
   * @param clipboard Needed to copy URL of endpoint
   * @param cdRef Needed to mark component as having changes
   */
  constructor(
    private activated: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private messageService: MessageService,
    public backendService: BackendService,
    private dialog: MatDialog,
    private diagnosticsService: DiagnosticsService,
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private bazarService: BazarService,
    private overlayContainer: OverlayContainer,
    private clipboard: Clipboard,
    private cdRef: ChangeDetectorRef,
    private location: Location) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {
    // get query parameters from url, if any
    this.getParams();

    // Check if backend is configured.
    // If backend is not configured yet, then all links are disabled.
    this.configService.configStatus.subscribe(status => {
      this.backendIsConfigured = status;
    });
    
    // Attempting to retrieve backend version.
    this.retrieveBackendVersion();

    this.currentYear = new Date().getFullYear();

    // setting theme value, if user has set previously, otherwise is set to light 
    this.theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';
    this.overlayContainer.getContainerElement().classList.add(this.theme);

    // retrieving list of stored backend urls in localstorage IF there are any
    localStorage.getItem('magic.backends') ? this.getBackends() : '';
    
    // wait for access list to be ready
    // then detect changes to update view
    (async () => {
      while (Object.keys(this.authService.access.auth).length === 0)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (Object.keys(this.authService.access.auth).length !== 0) {
        this.cdRef.detectChanges();
      }

    })();

    this.authService.authenticatedChanged.subscribe(status => {
      if (status) {
        this.getBackends();
      }
      this.currentBackend = this.backendService.current.url;
      this.cdRef.detectChanges();
    });
    
  }

  /**
   * Retrieving URL parameter
   */
  getParams() {
    /*
     * Checking if we have query parameters.
     */
    this.activated.queryParams.subscribe((params: Params) => {

      /*
       * Checking if user accessed system with a link containing query params.
       */
      
      const backend = params['backend'];
      const token = params['token'];

      // If url has parameters, we're identifying them
      if (backend) {

        // Check if the url exists in localstorage
        // so the availability of token can be detected
        let cur: Backend = {
          url: backend.replace(/\s/g, '').replace(/(\/)+$/,''),
        };
        if (JSON.parse(localStorage.getItem('magic.backends'))) {
          const currentBackend = JSON.parse(localStorage.getItem('magic.backends'));
          currentBackend.forEach((element: any) => {
            if (element.url === cur.url) {
              cur.username = element.username;
              cur.password = element.password;
              cur.token = element.token;
            }
          });
        }

        // Updating backend
        this.backendService.current = cur;

        // Based on token availability authentication status will be set
        if (!this.backendService.current.token) {
          this.authService.updateAuthStatus(false);
        } else {
          this.authService.updateAuthStatus(true);
        }
        this.location.replaceState('');
      }

      /*
       * Checking if user accessed system with an authentication link.
       */
      if (token && token.includes('.')) {

        /*
         * 'token' query parameter seems to be a JWT token.
         *
         * Authentication request, authenticating using specified link,
         * and redirecting user to hide URL.
         */
        const url = params['url'];
        const username = params['username'];

        // Updating current backend.
        this.backendService.current = {
          url,
          username,
          token,
        };

        // Verifying token is valid by invoking backend trying to refresh token.
        this.authService.verifyToken().subscribe(() => {

          // Signalling success to user.
          this.feedbackService.showInfo(`You were successfully authenticated as '${username}'`);

          // Checking if token is a 'reset-password' type of token.
          if (this.authService.roles().filter(x => x === 'reset-password').length > 0) {

            // Redirecting user to change-password route.
            this.router.navigate(['/change-password']);

          } else {

            // Redirecting user to avoid displaying JWT token in plain sight.
            this.router.navigate(['/']);

            // Making sure we refresh access rights.
            this.authService.createAccessRights();
          }

        }, (error: any) => {

          // Oops, failure to verify token.
          this.feedbackService.showError(error);
        });

      } else if (token) {

        /*
         * 'token' seems to be a "verify email address" type of token.
         *
         * Need to set the current backend first.
         */
        this.backendService.current = {
          url: params['url'],
          username: params['username'],
        };

        // Registration confirmation of email address.
        this.authService.verifyEmail(params['username'], token).subscribe((result: Response) => {

          // Checking for success.
          if (result.result === 'success') {

            // Success.
            this.feedbackService.showInfo('You successfully confirmed your email address');
            this.router.navigate(['/']);
          }
        });
      }
    });

    // Initializing current backend
    this.currentBackend = this.backendService.current.url;
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

  /**
   * Returns the user's status to caller.
   */
   public getUserUrl() {

    // Verifying user is connected to a backend.
    if (!this.backendService.connected) {
      return 'not connected';
    }

    // Removing schema and port from URL.
    let url = this.backendService.current.url.replace('http://', '').replace('https://', '');
    if (url.indexOf(':') !== -1) {
      url = url.substring(0, url.indexOf(':'));
    }

    return url;
    // Checking if user is authenticated.
    // if (this.authService.authenticated) {
    //   return this.backendService.current.username + ' / ' + url;
    // } else if (this.backendService.connected) {
    //   return 'anonymous / ' + url;
    // }
  }

  /**
   * Returns all roles user belongs to.
   */
  public getUserRoles() {
    return this.authService.roles().join(', ');
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
   * Allows user to login by showing a modal dialog.
   */
  public login(backendUrl?: string) {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '550px',
      data: backendUrl ? backendUrl : ''
    });
    dialogRef.afterClosed().subscribe(() => {
      this.authService.authenticated ? this.retrieveBackendVersion() : '';
      if (!this.notSmallScreen) {
        this.closeNavbar();
      }
    });
  }

   /**
   * Logs the user out from his current backend.
   */
  public logout() {
    this.authService.logout(false);
    if (!this.notSmallScreen) {
      this.closeNavbar();
    }
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
        this.bazarService.latestVersion().subscribe((result: Response) => {

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

  /**
   * Invoked when theme is changed.
   */
   public themeChanged(value: string) {
    this.theme = value;
     
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
   * Invoked when user wants to copy the full URL of the endpoint.
   */
   public copyBackendUrl(url?: string) {
     const currentURL: string = window.location.protocol + '//' + window.location.host;
     const param: string = currentURL + '?backend='
    if (!url){
      // Copies the currently edited endpoint's URL prepended by backend root URL.
      this.clipboard.copy(param + encodeURIComponent(this.backendService.current.url));
    } else {
      this.clipboard.copy(param + encodeURIComponent(url));
    }

    // Informing user that URL can be found on clipboard.
    this.feedbackService.showInfoShort('Backend URL was copied to your clipboard');
  }

  /**
   * retrieving list of stored backend urls in localstorage
   */
  getBackends() {
    this.listOfBackends = [];
    const list = JSON.parse(localStorage.getItem('magic.backends'));
    list.forEach((element: any) => {
      if (element.url !== ''){
        this.listOfBackends.push(element)
      }
    });
    
  }

  /**
   * Switching backend
   */
  switchBackend(backend: Backend) {
    // const currentURL: string = window.location.protocol + '//' + window.location.host;
    // const param: string = currentURL + '?backend=';
    // window.location.replace(param + encodeURIComponent(backend.url));
    // this.backendService.current = {
    //   url: backend.url,
    //   username: backend.username,
    //   password: backend.password,
    //   token: backend.token,
    // };
    // this.currentBackend = backend.url;
    this.login(backend.url);
  }
}
