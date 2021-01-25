
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
 * Home component for Magic Dashboard.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

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

  /*
   * Implementation of OnInit.
   */
  public ngOnInit() {

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
}
