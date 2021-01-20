
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { AuthService } from '../services/auth.service';
import { Response } from 'src/app/models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Register component allowing users to register in the system.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  /**
   * Email address of user.
   */
  public email: string;

  /**
   * Password of user.
   */
  public password: string;

  /**
   * Password of user repeated.
   */
  public repeatPassword: string;

  /**
   * Creates an instance of your component.
   * 
   * @param authService Needed to invoke backend to perform the actual registration
   * @param authService Needed to retrieve the current backend's URL
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private authService: AuthService,
    private backendService: BackendService,
    private feedbackService: FeedbackService) { }

  /**
   * Invoked when user clicks the register button.
   */
  public register() {

    // Verifying user correctly typed his password.
    if (this.password !== this.repeatPassword) {

      // Providing user with some basic feedback.
      this.feedbackService.showError('Passwords are not matching');
      return;
    }

    // Invoking backend to register user.
    this.authService.register(
      this.email,
      this.password,
      location.origin,
      this.backendService.current.url,
    ).subscribe((result: Response) => {

      // Providing feedback to user
      this.feedbackService.showInfo('You have been successfully registered at the site');

    }, (error: any) => this.feedbackService.showError(error));
  }
}
