
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { AuthService } from '../auth/services/auth.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Response } from 'src/app/models/response.model';

/**
 * Profile component allowing the user to change his password and other parts of his profile.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  /**
   * New password model.
   */
  public password: string;

  /**
   * Repeat new password.
   */
  public repeatPassword: string;

  /**
   * Creates an instance of your component.
   * 
   * @param authService Needed to actually change password
   * @param feedbackService NEeded to display feedback to user
   */
  public constructor(
    private authService: AuthService,
    private feedbackService: FeedbackService) { }

  /**
   * Invoked when user wants to change his password.
   */
  public changePassword() {

    // Changing password
    this.authService.changePassword(this.password).subscribe((result: Response) => {

      // Providing feedback to user.
      this.feedbackService.showInfoShort('Your password was successfully changed');

    }, (error: any) => this.feedbackService.showError(error));
  }
}
