
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { RegisterService } from 'src/app/services/register.service';
import { RecaptchaComponent } from 'ng-recaptcha';

/**
 * Register component allowing users to register in the system.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {

  private authSubscription: Subscription;

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
   * to set the user's site_key for recaptcha
   */
   recaptchaKey: string = null;
   @ViewChild('captchaRef', {static: false}) captchaRef: RecaptchaComponent;
   
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
    private formBuilder: FormBuilder) {
      this.recaptchaKey = this.backendService._activeCaptcha;
    }

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

    // In case user authenticates or logs out as we're on the form.
    this.authSubscription = this.backendService.authenticatedChanged.subscribe((authenticated: boolean) => {
      if (authenticated) {
        this.status = 'already-logged-in';
      } else {
        this.status = 'ok-to-register';
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  /**
   * Invoked when user clicks the register button.
   * @param recaptcha_token received when reCaptcha component is executed,
   * recaptcha_token is optional, exists only if recaptcha key is available
   */
  register(recaptcha_token?: string) {
    if (this.registrationForm.value.password === '') {
      this.feedbackService.showError('Please supply a password');
      return;
    } else if (this.registrationForm.value.password !== this.repeatPassword) {
      this.feedbackService.showError('Passwords are not matching');
      return;
    }

    const data: any = this.recaptchaKey !== null && this.recaptchaKey !== '' ? {
      username: this.registrationForm.value.email,
      password: this.registrationForm.value.password,
      frontendUrl: location.origin,
      recaptcha_response: recaptcha_token,
    } : {
      username: this.registrationForm.value.email,
      password: this.registrationForm.value.password,
      frontendUrl: location.origin
    };

    this.registerService.register(data).subscribe({
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
  
  /**
   * to make a click action on the invisible reCaptcha components and receive the token,
   * will be executed only if recaptcha key is available
   */
   executeRecaptcha(){
    this.captchaRef?.execute();
  }
}
