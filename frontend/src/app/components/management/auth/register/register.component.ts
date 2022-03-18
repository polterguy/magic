
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { RegisterService } from 'src/app/services/register.service';

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
  status = '';

  /**
   * Whether or not password should be displayed or hidden as the user types it.
   */
  hide = true;

  /**
   * Password of user repeated.
   */
  repeatPassword: string;

  /**
   * Creates an instance of your component.
   * 
   * @param registerService Needed to be able to register user in backend
   * @param backendService Needed to be able to determine if password will be sent in clear text or not
   * @param feedbackService Needed to provide feedback to user
   * @param formBuilder Needed to build our form
   */
  constructor(
    private registerService: RegisterService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    private formBuilder: FormBuilder) { }

  /**
   * Reactive form declaration
   */
  registrationForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    if (this.backendService.active?.token) {
      this.status = 'already-logged-in';
    } else {
      this.status = 'ok-to-register';
    }
  }

  /**
   * Invoked when user clicks the register button.
   */
  register() {
    if (this.registrationForm.value.password === '') {
      this.feedbackService.showError('Please supply a password');
      return;
    } else if (this.registrationForm.value.password !== this.repeatPassword) {
      this.feedbackService.showError('Passwords are not matching');
      return;
    }

    this.registerService.register(
      this.registrationForm.value.email,
      this.registrationForm.value.password,
      location.origin,
    ).subscribe({
      next: (result: Response) => {
        this.status = result.result;
        if (result.result === 'already-registered') {
          this.feedbackService.showError('You are already registered in backend');
        } else if (result.result === 'confirm-email-address-email-sent') {
          this.feedbackService.showInfo('You have been successfully registered in the system, please verify your email address by clicking the link in the email we just sent you');
        } else if (result.result === 'email-sent-to-moderator') {
          this.feedbackService.showInfo('You have been successfully registered in the system, please wait for a moderator to accept you as a user');
        } else {
          this.feedbackService.showInfo('You have been successfully registered in the system');
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
