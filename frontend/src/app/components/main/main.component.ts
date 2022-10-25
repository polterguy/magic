
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { Backend } from 'src/app/models/backend.model';
import { Response } from 'src/app/models/response.model';
import { ThemeService } from 'src/app/services/theme.service';
import { LoaderService } from 'src/app/services/loader.service';
import { NavbarService } from 'src/app/services/navbar.service';
import { BackendService } from 'src/app/services/backend.service';
import { RegisterService } from 'src/app/services/register.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { UpdatePwaService } from 'src/app/services/update-pwa.service';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'main-root',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  // Needed to be able to figure out if we're on a small screen or not.
  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    const getScreenWidth = window.innerWidth;
    this.largeScreen = getScreenWidth >= 768 ? true : false;
    if (!this.largeScreen) {
      this.navbarService.expanded = false;
    }
  }

  /**
   * Helper to determine how to show the navbar. If we're on a small screen, we show
   * it as an expandable only visible as hamburger button is clicked. Otherwise we
   * show it as a constant visible menu with the option of making it smaller bu clicking
   * a button.
   */
  largeScreen: boolean;

  /**
   * Creates an instance of your component.
   *
   * @param activated Needed to retrieve query parameters
   * @param registerService Needed to allow anonymous users to register
   * @param location Needed to be able to remove query parameters
   * @param loaderService Loader service used to display Ajax spinner during invocations to the backend
   * @param router Needed to redirect user as he or she logs out
   * @param navbarService Navbar service keeping track of state of navbar
   * @param themeService Needed to determine which theme we're using
   * @param backendService Needed such that we can subscribe to authentication events
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private activated: ActivatedRoute,
    private registerService: RegisterService,
    private location: Location,
    public loaderService: LoaderService,
    private router: Router,
    public navbarService: NavbarService,
    public themeService: ThemeService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    private updatePwaService: UpdatePwaService) {
      this.updatePwaService.checkForUpdates();

  }

  /**
   * OnInit implementation.
   */
  ngOnInit() {

    // Checking for query parameters.
    this.getParams();

    // Checking the screen width rule for initial setting
    this.onWindowResize();

    // Subscribing to status changes and redirect accordingly if we need user to setup system.
    this.backendService.statusRetrieved.subscribe((status: Status) => {
      if (status) {
        if (!status.config_done || !status.magic_crudified || !status.server_keypair) {
          this.router.navigate(['/config']);
        }
      }
    });

    // Making sure we redirect to dashboard if user is no longer authenticated.
    this.backendService.authenticatedChanged.subscribe((authenticated: boolean) => {
      if (!authenticated) {
        switch (window.location.pathname) {
          case '/register':
          case '/about':
          case '/keys':
          case '/':
            break;
          default:
            this.router.navigate(['/']);
        }
      }
    });

    // Retrieving recaptcha key and storing in the backend service to be accessible everywhere.
    // Only if active backend is available, to prevent recaptcha errors in the console.
    if (this.backendService.active) {
      this.backendService.getRecaptchaKey();

      this.backendService.verifyToken().subscribe({
        next: (res: any) => {
          if (!res) {
            this.backendService.logout(false);
          } else if (res.result && res.result !== 'success') {
            this.backendService.logout(false);
          }
        }, 
        error: () => this.backendService.logout(false)
      });
    }
  }

  /**
   * Closes the navbar.
   */
  closeNavbar() {
    this.navbarService.expanded = false;
  }

  /*
   * Private helper methods.
   */

  /*
   * Retrieving URL parameter
   */
  private getParams() {

    // Parsing query parameters.
    this.activated.queryParams.subscribe((params: Params) => {

      // Checking if user accessed system with a link containing query param pointing to specific backend.
      const backend = params['backend'];
      if (backend) {
        const cur = new Backend(backend);

        // Making sure we keep existing username, password and token, if we have these values.
        const old = this.backendService.backends.filter(x => x.url === cur.url);
        if (old.length > 0) {
          cur.username = old[0].username;
          cur.password = old[0].password;
          cur.token = old[0].token;
        }
        this.backendService.upsert(cur);
        this.backendService.activate(cur);
        this.location.replaceState('');

      } else {

        // Checking if user has some sort of token, implying reset-password token or verify-email token.
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
          const backend = new Backend(url, username, null, token);
          this.backendService.upsert(backend);
          this.backendService.activate(backend);
          this.backendService.verifyToken().subscribe({
            next: (result: any) => {

              if (result.result !== 'success') {
                this.backendService.logout(false);
                this.feedbackService.showError('Bogus token');
                return;
              }

              this.feedbackService.showInfo(`You were successfully authenticated as '${username}'`);

              // Checking if this is an impersonation request or a change-password request.
              if (this.backendService.active.token?.in_role('reset-password')) {

                // Change password request.
                this.router.navigate(['/change-password']);

              } else {

                // Impersonation request.
                this.location.replaceState('');
              }
            },
            error: (error: any) => this.feedbackService.showError(error)
          });

        } else if (token) {

          /*
           * 'token' seems to be a "verify email address" type of token since it doesn't contain "." characters.
           *
           * Need to set the current backend first.
           */
          const backend = new Backend(params['url'], params['username']);
          this.backendService.upsert(backend);
          this.backendService.activate(backend);

          // Verifying user's email address.
          this.registerService.verifyEmail(params['username'], token).subscribe({
            next: (result: Response) => {
              if (result.result === 'success') {
                this.feedbackService.showInfo('You successfully confirmed your email address');
                this.location.replaceState('');
              }
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
        } else {
          this.getStatus();
        }
      }
    });
  }

  private getStatus() {

    // If we have an active backend we need to retrieve endpoints for it.
    if (this.backendService.active) {
      this.backendService.getEndpoints(this.backendService.active);

      // If user is root we'll need to retrieve status of active backend and its version.
      if (this.backendService.active.token && !this.backendService.active.token.expired && this.backendService.active.token.in_role('root')) {
        this.backendService.retrieveStatusAndVersion(this.backendService.active);
      }
    }
  }
}
