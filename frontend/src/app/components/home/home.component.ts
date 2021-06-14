
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { Messages } from 'src/app/models/messages.model';
import { AuthService } from '../auth/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { DiagnosticsService } from '../diagnostics/services/diagnostics.service';

/**
 * Home component for Magic Dashboard.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  /**
   * Backend version as returned from server if authenticated.
   */
   public version: string;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to redirect user after having verified his authentication token
   * @param authService Needed to verify user is authenticated
   * @param activated Needed to retrieve query parameters
   * @param backendService Needed modify backend values according to query parameters given
   * @param diagnosticsService Needed to retrieve backend version
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private router: Router,
    public authService: AuthService,
    private activated: ActivatedRoute,
    private backendService: BackendService,
    private messageService: MessageService,
    private diagnosticsService: DiagnosticsService,
    private feedbackService: FeedbackService) { }

  /*
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
      }
    });
  }

  /**
   * OnDestroy implementation.
   */
  ngOnDestroy() {

    // Making sure we unsibscribe to subscription.
    this.subscription.unsubscribe();
  }

  /*
   * Private helepr methods.
   */

  /*
   * Retrieves backend version.
   */
  private retrieveBackendVersion() {

    // Retrieving backend version if we're authenticated.
    if (this.authService.authenticated) {

      // Invoking backend to retrieve version.
      this.diagnosticsService.version().subscribe((version: any) => {
        this.version = 'v' + version.version;
      });
    } else {

      // Unknown backend version since we're obviously not connected to any backend.
      this.version = '';
    }
  }
}
