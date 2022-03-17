
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { AuthService } from '../../../../services/auth.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BackendService } from 'src/app/services/backend.service';

/**
 * Change password component allowing users to change their current password.
 */
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {


  /**
   * for toggling password
   */
  public hide: boolean = true;
  /**
   * New password user wants to use.
   */
  public password = '';

  /**
   * Repeated value of new password user wants to use.
   */
  public repeatPassword = '';

  /**
   * Creates an instance of your component.
   * 
   * @param authService Needed to invoke backend to actually perform the password change
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private authService: AuthService,
    private feedbackService: FeedbackService,
    public backendService: BackendService) { }

  
  /**
   * Invoked when user wants to save his or her password.
   */
  public savePassword() {

    // Sanity checking password.
    if (this.password.length !== 0 || this.password === this.repeatPassword) {

      // Invoking backend to perform actual password update.
      this.authService.changePassword(this.password).subscribe(() => {

        // Providing user with some feedback, and forcing user to login again.
        this.feedbackService.showInfoShort('Your password was successfully updated, please login again');
        this.backendService.logoutFromCurrent(true);

      }, (error: any) => this.feedbackService.showError(error));
    }
  }
}
