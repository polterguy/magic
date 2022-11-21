
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { RecaptchaComponent } from 'ng-recaptcha';
import { map, startWith, tap } from 'rxjs/operators';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Backend } from 'src/app/models/backend.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services--/message.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from '../../../services--/feedback.service';

class DialogData {
  allowAuthentication?: boolean;
}

/**
 * Login dialog allowing user to login to a backend of his choice.
 */
@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  hide = true;
  backends: FormControl = null;
  filteredBackends: Observable<string[]>;
  savePassword: boolean = true;
  backendHasBeenSelected: boolean = false;
  autoLogin: boolean = false;
  advanced: boolean = false;

  /**
   * To store the value of input for forgot password form
   */
  forgotPass_username: string = '';

  /**
   * Changes to true if clicking on the forgot password button
   */
  forgotPass: boolean = false;

  /**
   * to set the user's site_key for recaptcha
   */
   recaptchaKey: string = null;
   @ViewChild('captchaRef', {static: false}) captchaRef: RecaptchaComponent;
   @ViewChild('forgotInput', {static: false}) forgotInput: ElementRef;

  /**
   * Creates an instance of your login dialog.
   *
   * @param router Router service to redirect and check current route
   * @param dialogRef Needed to be able to close dialog after having logged in
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param dialogRef Reference to self, to allow for closing dialog as user has successfully logged in
   * @param backendService Service to keep track of currently selected backend
   * @param formBuilder Needed to build form
   * @param data Input data to form declaring if user can login or not
   */
  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private feedbackService: FeedbackService,
    protected messageService: MessageService,
    public backendService: BackendService,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.data = this.data || { allowAuthentication: true };
    this.backendService._activeCaptchaValue.subscribe((key: string) => {
      this.recaptchaKey = key;
    })
  }

  /**
   * reactive form declaration
   */
  loginForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    backends: ['', [Validators.required]]
  });

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.backends = new FormControl();
    if (this.data.allowAuthentication && this.backendService.active && this.backendService.active) {
      this.backends.setValue(this.backendService.active.url);
      this.backendHasBeenSelected = true;
      this.backendSelected();
    }
    this.filteredBackends = this.backends.valueChanges
      .pipe(
        startWith(''),
        map(() => this.filter(this.backends.value)));

    this.loginForm.controls.username.valueChanges.pipe(tap(value => {
      this.loginForm.controls.username.setValue(value.replace(/[^a-z0-9]/ig, "").toLowerCase(), { emitEvent: false });
    })).subscribe();
  }

  /**
   * Invoked when a backend has been chosen from the
   * persisted backends.
   */
  backendSelected() {
    const el = this.backendService.backends.filter(x => x.url === this.backends.value);
    if (el.length > 0) {
      this.loginForm.patchValue({
        username: el[0].username || '',
        password: el[0].password || ''
      });
    }
    this.backendValueChanged();
  }

  /**
   * Invoked when the backend URL has been changed, for whatever reason.
   */
  backendValueChanged() {
    if (this.backends.value && this.backends.value !== '') {
      this.backendService.autoAuth(this.backends.value).subscribe({
        next: (result: Response) => {
          this.backendHasBeenSelected = true;

          /*
           * Checking if backend allows for auto-auth, and if so allowing user to click
           * login button without providing username or password.
           */
          if (result.result === 'on') {
            this.autoLogin = true;
            this.loginForm.patchValue({
              username: ''
            });
          } else {
            this.autoLogin = false;
          }
          this.loginForm.patchValue({
            backends: this.backends.value
          });
          this.data.allowAuthentication === true ? '' : this.connectToBackendWithoutLogin();
        },
        error: () => {
          this.feedbackService.showError('Could not find that backend');
          this.backendHasBeenSelected = false;
        }});
    }
  }

  /**
   * Invoked when we should connect to backend without logging in.
   */
  connectToBackendWithoutLogin() {
    const backend = new Backend(this.backends.value, this.autoLogin === false || this.advanced ? this.loginForm.value.username : null, this.savePassword ? this.loginForm.value.password : null)
    this.backendService.upsert(backend);
    this.backendService.activate(backend);
    this.dialogRef.close();
  }

  /**
   * Invoked when user requests a reset password link to be generated
   * and sent to him on email.
   *
   * Notice, assumes username is a valid email address.
   * @param recaptcha_token received when reCaptcha component is executed,
   * recaptcha_token is optional, exists only if recaptcha key is available
   */
  resetPassword(recaptcha_token?: string) {

    /*
     * Storing currently selected backend.
     * This is necessary to make sure we send reset password email to correct backend/user.
     */
    const backend = new Backend(this.backends.value)
    this.backendService.upsert(backend);
    this.backendService.activate(backend, false);

    const data: any = this.recaptchaKey !== null && this.recaptchaKey !== '' ? {
      username: this.forgotPass_username,
      frontendUrl: location.origin,
      recaptcha_response: recaptcha_token,
    } : {
      username: this.forgotPass_username,
      frontendUrl: location.origin
    };
    this.backendService.resetPassword(data).subscribe({
        next: (res: Response) => {
          if (res.result === 'success') {
            this.feedbackService.showInfo('Pease check your email to reset your password');
          } else {
            this.feedbackService.showInfo(res.result);
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

  /**
   * Invoked when user wants to login to currently selected backend.
   */
  login() {

    /*
     * Storing currently selected backend.
     * Notice, this has to be done before we authenticate, since
     * the auth service depends upon user already having selected
     * a current backend.
     */
    const backend = new Backend(this.backends.value, this.autoLogin === false || this.advanced ? this.loginForm.value.username : null, this.savePassword ? this.loginForm.value.password : null)
    this.backendService.upsert(backend);
    this.backendService.activate(backend);
    this.backendService.login(
      this.autoLogin === false || this.advanced ? this.loginForm.value.username : null,
      this.autoLogin === false || this.advanced ? this.loginForm.value.password : null,
      this.savePassword).subscribe({
        next: () => {
          if (window.location.pathname === '/register') {
            this.router.navigate(['/']);
          }
          this.dialogRef.close({});
        },
        error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Private helper methods
   */

  /*
   * Filter method to allow for filtering the results of
   * the auto completer.
   */
  private filter(value: string) {
    return this.backendService.backends
      .filter(x => x.url.includes(value) && x.url !== value)
      .map(x => x.url);
  }

  public toggleForgotPass(status: boolean) {
    this.forgotPass = status;
    if (status === true) {
      setTimeout(() => {
        this.forgotInput.nativeElement.focus();
      }, 200);
    }
  }
}
