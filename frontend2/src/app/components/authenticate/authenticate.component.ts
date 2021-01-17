
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Application specific imports.
import { AuthService } from '../auth/services/auth.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Authenticate component, that requires a token QUERY parameter, injecting
 * it into the specified backend as the current JWT token
 */
@Component({
  selector: 'app-authenticate',
  templateUrl: './authenticate.component.html'
})
export class AuthenticateComponent implements OnInit {

  /**
   * Whether or not authentication was successful or not.
   */
  public success: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to redirect user after having verified his authentication token
   * @param activated Needed to retrieve query parameters
   * @param authService Needed to verify user is authenticated
   * @param backendService Needed modify backend values according to query parameters given
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private router: Router,
    private activated: ActivatedRoute,
    private authService: AuthService,
    private backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving relevant query parameters.
    const token = this.activated.queryParams.subscribe((params: Params) => {

      // Retrieving query parameters and making sure we correctly configure backend.
      const url = params['url'];
      const username = params['username'];
      const token = params['token'];

      // Updating current backend.
      this.backendService.current = {
        url,
        username,
        token,
      };

      // Verifying token is valid by invoking backend trying to refresh token.
      this.authService.verifyToken().subscribe(res => {

        // Signalling success to markup.
        this.success = true;
        this.feedbackService.showInfo('You were successfully authenticated');

        // Waiting some few seconds before redirecting user.
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);

      }, (error: any) => {

        // Oops, failure to verify token.
        this.success = false;
        this.feedbackService.showError(error);
      });
    });
  }
}
