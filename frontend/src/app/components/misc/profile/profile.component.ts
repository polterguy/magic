
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';
import { BackendService } from 'src/app/services/backend.service';

/**
 * Profile component allowing the user to change his password and other parts related to his profile.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent {

  /**
   * New password model.
   */
  password: string;

  /**
   * Repeat new password.
   */
  repeatPassword: string;

  /**
   * Creates an instance of your component.
   * 
   * @param authService Needed to actually change password
   * @param feedbackService NEeded to display feedback to user
   */
  constructor(
    private backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Invoked when user wants to change his password.
   */
  changePassword() {
    this.backendService.changePassword(this.password).subscribe({
      next: () => this.feedbackService.showInfoShort('Your password was successfully changed'),
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
