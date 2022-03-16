
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Application specific imports.
import { AuthService } from '../../../../services/auth.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Backend } from 'src/app/models/backend.model';

/**
 * Confirm email address component allowing the user to confirm his email address,
 * used during the registration process, etc.
 */
@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html'
})
export class ConfirmEmailComponent implements OnInit {

  /**
   * Creates an instance of your component.
   * 
   * @param router Needed to redirect user to landing page after having confirmed his email
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
     * Retrieving query parameters needed to verify email address towards backend.
     */
    this.activated.queryParams.subscribe((params: Params) => {

      const token = params['token'];
      const url = params['url'];
      const username = params['username'];
      this.backendService.current = new Backend(url, username, null, null);

      // Verifying email address by invoking backend.
      this.authService.verifyEmail(username, token).subscribe(() => {

        // Signalling success to user.
        this.feedbackService.showInfo('You have successfully verified your email address');

        /*
         * Logging user out, forcing the user to login again,
         * which will allow him to store his or her credentials
         * in the browser storage.
         */
        this.authService.logout(true, false);
        this.feedbackService.showInfo('Your email address was successully confirmed, please login again');
        this.router.navigate(['/']);


      }, (error: any) => {

        // Oops, failure to verify token.
        this.feedbackService.showError(error);
      });
    });
  }
}
