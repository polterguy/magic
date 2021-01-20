
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

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
export class RegisterComponent implements OnInit {

  /**
   * Status of component, allowing us to display different types of UI,
   * depending upon whether or not user is authenticated, already registered, etc.
   */
  public status = '';

  /**
   * Whether or not password should be displayed or hidden as the user types it.
   */
  public hide = true;

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
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Checking status of user.
    if (this.authService.authenticated) {
      this.status = 'already-logged-in';
    } else {
      this.status = 'ok-to-register';
    }
  }

  /**
   * Invoked when user clicks the register button.
   */
  public register() {

    // Verifying user correctly typed his password.
    if (this.password === '') {

      // Providing user with some basic feedback.
      this.feedbackService.showError('Please supply a password');
      return;

    } else if (this.password !== this.repeatPassword) {

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

      // Checking result of invocation.
      if (result.result === 'already-registered') {

        // Providing feedback to user.
        this.feedbackService.showError('You are already registered in backend');
      } else if (result.result === 'confirm-email-address-email-sent') {

        // Providing feedback to user.
        this.feedbackService.showInfo('You have been successfully registered at the site, please verify your email address by clicking the link in the email we just sent you');
      } else if (result.result === 'email-sent-to-moderator') {

        // Providing feedback to user.
        this.feedbackService.showInfo('You have been successfully registered at the site, please wait for a moderator to accept you as a user');
      } else {

        // Providing feedback to user.
        this.feedbackService.showInfo('You have been successfully registered at the site');
      }

    }, (error: any) => this.feedbackService.showError(error));
  }
}
