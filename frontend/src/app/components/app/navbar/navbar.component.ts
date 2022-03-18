
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
import { Location } from '@angular/common'; 
import { Clipboard } from '@angular/cdk/clipboard';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { Backend } from 'src/app/models/backend.model';
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { AuthService } from 'src/app/services/auth.service';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { RegisterService } from 'src/app/services/register.service';
import { BazarService } from '../../../services/management/bazar.service';
import { DiagnosticsService } from '../../../services/diagnostics.service';
import { ConfigService } from '../../../services/management/config.service';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

/**
 * Navbar component wrapping main navigation in dashboard.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {

  backendIsConfigured: boolean = undefined;

  currentYear: number;

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
  theme: string;

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
   * @param registerService Needed to allow anonymous users to register
   * @param cdRef Needed to mark component as having changes
   * @param location Needed to be able to remove query parameters
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
    private registerService: RegisterService,
    private cdRef: ChangeDetectorRef,
    private location: Location) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.getParams();
    this.configService.configStatus.subscribe(status => {
      this.backendIsConfigured = status;
    });
    this.retrieveBackendVersion();
    this.currentYear = new Date().getFullYear();
    this.theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';
    this.overlayContainer.getContainerElement().classList.add(this.theme);

    // wait for access list to be ready
    // then detect changes to update view
    (async () => {
      while (Object.keys(this.backendService.active.access.auth).length === 0)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (Object.keys(this.backendService.active.access.auth).length !== 0) {
        this.cdRef.detectChanges();
      }
    })();
    this.backendService.authenticatedChanged.subscribe(() => {
      this.cdRef.detectChanges();
    });
  }

  /**
   * Toggles the navbar.
   */
  toggleNavbar() {
    this.messageService.sendMessage({
      name: Messages.TOGGLE_NAVBAR
    });
  }

  /**
   * Returns the user's status to caller.
   */
  getUserUrl() {
    if (!this.backendService.active) {
      return 'not connected';
    }
    let url = this.backendService.active.url.replace('http://', '').replace('https://', '');
    return url;
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.messageService.sendMessage({
      name: Messages.CLOSE_NAVBAR
    });
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  login(allowAuthentication: boolean) {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '550px',
      data: {
        allowAuthentication
      }
    });
    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        this.retrieveBackendVersion();
      }
      if (!this.notSmallScreen) {
        this.closeNavbar();
      }
    });
  }

   /**
   * Logs the user out from his current backend.
   */
  logout() {
    this.authService.logoutFromCurrent(false);
    if (!this.notSmallScreen) {
      this.closeNavbar();
    }
  }

  /**
   * Invoked when theme is changed.
   */
  themeChanged(value: string) {
    this.theme = value;
    this.overlayContainer.getContainerElement().classList.remove(localStorage.getItem('theme'));
    this.messageService.sendMessage({
      name: Messages.THEME_CHANGED,
      content: value,
    });
    localStorage.setItem('theme', value);
    this.overlayContainer.getContainerElement().classList.add(value);
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  copyBackendUrl(url?: string) {
    const currentURL: string = window.location.protocol + '//' + window.location.host;
    const param: string = currentURL + '?backend='
    this.clipboard.copy(param + encodeURIComponent(url));
    this.feedbackService.showInfoShort('Backend URL was copied to your clipboard');
  }

  /**
   * Switching backend
   */
  switchBackend(backend: Backend) {
    const currentURL: string = window.location.protocol + '//' + window.location.host;
    this.backendService.upsertAndActivate(backend);
    window.location.replace(currentURL);
  }

  /**
   * Removes specified backend from local storage
   * 
   * @param backend Backend to remove
   */
  deleteBackend(backend: Backend) {
    if (this.backendService.remove(backend)) {
      const currentURL: string = window.location.protocol + '//' + window.location.host;
      window.location.replace(currentURL);
    }
  }

  /*
   * Private helper methods.
   */

  /*
   * Retrieving URL parameter
   */
  private getParams() {

    this.activated.queryParams.subscribe((params: Params) => {

      /*
       * Checking if user accessed system with a link containing query params.
       */
      const backend = params['backend'];
      if (backend) {
        const cur: Backend = new Backend(backend);
        const old = this.backendService.backends.filter(x => x.url === cur.url);
        if (old.length > 0) {
          cur.username = old[0].username;
          cur.password = old[0].password;
          cur.token = old[0].token;
        }
        this.backendService.upsertAndActivate(cur);
        this.location.replaceState('');
      }
      const token = params['token'];
      if (token && token.includes('.')) {

        /*
         * 'token' query parameter seems to be a JWT token.
         *
         * Authentication request, authenticating using specified link,
         * and redirecting user to hide URL.
         */
        const url = params['url'];
        const username = params['username'];
        this.backendService.upsertAndActivate(new Backend(url, username, null, token));
        this.authService.verifyTokenForCurrent().subscribe({
          next: () => {
            this.feedbackService.showInfo(`You were successfully authenticated as '${username}'`);
            if (this.backendService.active.token.in_role('reset-password')) {
              this.router.navigate(['/change-password']);
            } else {
              this.router.navigate(['/']);
              this.backendService.active.createAccessRights();
            }
          },
          error: (error: any) => this.feedbackService.showError(error)});

      } else if (token) {

        /*
         * 'token' seems to be a "verify email address" type of token.
         *
         * Need to set the current backend first.
         */
        this.backendService.upsertAndActivate(new Backend(params['url'], params['username']));
        this.registerService.verifyEmail(params['username'], token).subscribe({
          next: (result: Response) => {
            if (result.result === 'success') {
              this.feedbackService.showInfo('You successfully confirmed your email address');
              this.router.navigate(['/']);
            }
          },
          error: (error: any) => this.feedbackService.showError(error)});
      }
    });
  }

  /*
   * Retrieves backend version.
   */
  private retrieveBackendVersion() {
    if (this.backendService.active?.token?.in_role('root')) {
      this.diagnosticsService.version().subscribe({
        next: (version: any) => {
          this.version = version.version;
          this.bazarService.latestVersion().subscribe({
            next: (result: Response) => {
              this.bazarVersion = result.result;
              if (this.bazarVersion !== this.version) {
                this.configService.versionCompare(this.bazarVersion, this.version).subscribe((result: Response) => {

                  /*
                   * Checking return value of invocation, and if it was +1, the Bazar
                   * claims there exists a newer version of the core.
                   */
                  if (+result.result === 1) {
                    this.feedbackService.showInfo('There has been published an updated version of Magic. You should probably update your current version.');
                    this.shouldUpdateCore = true;
                  }
                });
              }
            },
            error: (error: any) => this.feedbackService.showError(error)});
          },
          error: () => this.authService.logoutFromCurrent(false)});
    } else {
      this.version = '';
    }
  }
}
