
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';

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
  hide: boolean = true;

  /**
   * New password user wants to use.
   */
  password = '';

  /**
   * Repeated value of new password user wants to use.
   */
  repeatPassword = '';

  /**
   * Creates an instance of your component.
   *
   * @param feedbackService Needed to provide feedback to user
   * @param backendService Needed to check if password will be transmitted in clear text
   */
  constructor(
    private feedbackService: FeedbackService,
    public backendService: BackendService) { }


  /**
   * Invoked when user wants to save his or her password.
   */
  savePassword() {
    if (this.password.length !== 0 || this.password === this.repeatPassword) {
      this.backendService.changePassword(this.password).subscribe({
        next: () => {
          this.feedbackService.showInfoShort('Your password was successfully updated, please login again');
          this.backendService.logout(true);
        },
        error: (error: any) => this.feedbackService.showError(error)});
    }
  }
}
