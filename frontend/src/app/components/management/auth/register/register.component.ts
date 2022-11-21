
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { debounceTime, distinctUntilChanged, filter, fromEvent, map, of, pairwise, startWith, Subscription, tap } from 'rxjs';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { RegisterService } from 'src/app/services--/register.service';
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

  emailRes: string = ''; // waiting | email-available | email-taken
  usernameRes: string = ''; // waiting | username-available | username-taken

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
      this.backendService._activeCaptchaValue.subscribe((key: string) => {
        this.recaptchaKey = key;
      })
    }

  /**
   * Reactive form declaration
   */
  registrationForm = this.formBuilder.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(128)]],
    name: [''],
    email: ['', [Validators.email]],
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
    this.watchForUsername('username');
    this.watchForUsername('email');

    this.registrationForm.controls.username.valueChanges.pipe(tap(value=>{
      this.registrationForm.controls.username.setValue(value.replace(/[^a-z0-9]/ig, "").toLowerCase(), { emitEvent: false });
    })).subscribe();
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
    if (this.registrationForm.value.email !== '' && this.emailRes !== 'email-available') {
      this.feedbackService.showError('Either remove the email address or type a correct one.')
      return;
    }
    if (this.registrationForm.value.username !== '' && this.usernameRes !== 'username-available') {
      this.feedbackService.showError('Username must be unique.')
      return;
    }

    if (this.registrationForm.valid) {
      const data: any = this.recaptchaKey !== null && this.recaptchaKey !== '' ? {
        username: this.registrationForm.value.username,
        password: this.registrationForm.value.password,
        frontendUrl: location.origin,
        recaptcha_response: recaptcha_token,
        extra: {
          email: this.registrationForm.value.email,
          name: this.registrationForm.value.name
        }
      } : {
        username: this.registrationForm.value.username,
        password: this.registrationForm.value.password,
        frontendUrl: location.origin,
        extra: {
          email: this.registrationForm.value.email,
          name: this.registrationForm.value.name
        }
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
    } else {
      this.feedbackService.showError('Please check your email and username.');
    }
  }

  /**
   * to make a click action on the invisible reCaptcha components and receive the token,
   * will be executed only if recaptcha key is available
   */
   executeRecaptcha(){
    this.captchaRef?.execute();
  }

  watchForUsername(field: string) {
    this.registrationForm.controls[field].valueChanges
    .pipe(

      // Time in milliseconds between key events
      debounceTime(1000),

      // If previous query is diffent from current
      distinctUntilChanged(),
      // get value
      map((event: any) => {
        if (this.registrationForm.value[field].length + 1 > 3 && this.registrationForm.controls[field].valid) {
          field === 'username' ? this.usernameRes = 'waiting' : this.emailRes = 'waiting';
        } else {
          field === 'username' ? this.usernameRes = '' : this.emailRes = '';
        }
        return this.registrationForm.controls[field].value
      }),
      // if character length greater then 2
      filter(res => this.registrationForm.value[field].length + 1 > 3)


      // subscription for response
    ).subscribe((text: string) => {

      if (this.registrationForm.controls[field].valid) {
        field === 'username' ? this.checkUsername(text) : this.checkEmail(text);
      }

    });
  }

  checkUsername(term: string) {

    if (term === '') {
      return of([]);
    }
    return this.registerService.usernameAvailability(encodeURIComponent(term)).subscribe({
      next: (res) => {
        this.usernameRes = res.result;
      },
      error: (err) => {}
    });
  }

  checkEmail(term: string) {

    if (term === '') {
      return of([]);
    }
    return this.registerService.emailAvailability(encodeURIComponent(term)).subscribe({
      next: (res) => {
        this.emailRes = res.result;
      },
      error: (err) => {}
    });
  }
}
