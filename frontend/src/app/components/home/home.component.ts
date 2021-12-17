
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { Messages } from 'src/app/models/messages.model';
import { AuthService } from '../auth/services/auth.service';
import { BazarService } from '../bazar/services/bazar.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { ConfigService } from '../config/services/config.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { DiagnosticsService } from '../diagnostics/services/diagnostics.service';
import { LoginDialogComponent } from '../app/login-dialog/login-dialog.component';
import { MatDialog } from '@angular/material/dialog';

/**
 * Home component for Magic Dashboard.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  // Subscription for login and logout message subscriptions.
  private subscription: Subscription;

  /**
   * Backend version as returned from server if authenticated.
   */
  public version: string = null;

  /**
   * Latest version of Magic as published by the Bazar.
   */
  public bazarVersion: string = null;

  /**
   * If there exists a newer version of Magic Core as published by the Bazar,
   * this value will be true.
   */
  public shouldUpdateCore: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to redirect user after having verified his authentication token
   * @param dialog Needed to allow user to login
   * @param authService Needed to verify user is authenticated
   * @param activated Needed to retrieve query parameters
   * @param backendService Needed modify backend values according to query parameters given
   * @param messageService Needed to subscribe to messages informing us when user logs in and out
   * @param diagnosticsService Needed to retrieve backend version
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private router: Router,
    private dialog: MatDialog,
    public authService: AuthService,
    private activated: ActivatedRoute,
    private bazarService: BazarService,
    private configService: ConfigService,
    private backendService: BackendService,
    private messageService: MessageService,
    private diagnosticsService: DiagnosticsService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Attempting to retrieve backend version.
    this.retrieveBackendVersion();

    // Need to dubscriber to login/logout to be able to retrieve backend version.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      if (msg.name === Messages.USER_LOGGED_IN || msg.name === Messages.USER_LOGGED_OUT) {
        this.retrieveBackendVersion();
      }
    });

    /*
     * Checking if we have an authentication token.
     */
    this.activated.queryParams.subscribe((params: Params) => {

      /*
       * Checking if user accessed system with an authentication link.
       */
      const token = params['token'];
      if (token) {

        /*
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
          }

        }, (error: any) => {

          // Oops, failure to verify token.
          this.feedbackService.showError(error);
        });

      } else {

        // No token supplied, checking for hash.
        const hash = params['hash'];
        if (hash) {

          // Need to set the current backend first.
          this.backendService.current = {
            url: params['url'],
            username: params['username'],
          };

          // Registration confirmation of email address.
          this.authService.verifyEmail(params['username'], hash).subscribe((result: Response) => {

            // Checking for success.
            if (result.result === 'success') {

              // Success.
              this.feedbackService.showInfo('You successfully confirmed your email address');
              this.router.navigate(['/']);
            }
          });
        }
      }
    });
  }

  /**
   * OnDestroy implementation.
   */
  public ngOnDestroy() {

    // Making sure we unsibscribe to subscription.
    this.subscription.unsubscribe();
  }

  /**
   * Invoked when user wants to login.
   */
  public login() {
    this.dialog.open(LoginDialogComponent, {
      width: '550px',
    });
  }

  /*
   * Private helepr methods.
   */

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
