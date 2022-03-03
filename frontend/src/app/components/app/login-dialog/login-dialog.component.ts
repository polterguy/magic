
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from '../../../services/feedback.service';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';

/**
 * Login dialog allowing user to login to a backend of his choice.
 */
@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  public hide = true;
  public backends: FormControl = null;
  public filteredBackends: Observable<string[]>;
  public savePassword: boolean = false;
  public backendHasBeenSelected: boolean = false;
  public autoLogin: boolean = false;
  public advanced: boolean = false;

  /**
   * Creates an instance of your login dialog.
   * 
   * @param router Router service to redirect and check current route
   * @param configService Configuration service used to determine if system has been setup if root user logs in
   * @param dialogRef Needed to be able to close dialog after having logged in
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param dialogRef Reference to self, to allow for closing dialog as user has successfully logged in
   * @param authService Dependency injected authentication and authorisation service
   * @param backendService Service to keep track of currently selected backend
   */
  constructor(
    private router: Router,
    private configService: ConfigService,
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private feedbackService: FeedbackService,
    protected messageService: MessageService,
    public authService: AuthService,
    public backendService: BackendService,
    private formBuilder: FormBuilder) { }

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
  public ngOnInit() {

    // Creating filter backends form control.
    this.backends = new FormControl();
    this.backends.setValue('');

    // Making sure we subscribe to value changes on backend text box, such that we can filter the backends accordingly.
    this.filteredBackends = this.backends.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filter(value))
      );
  }

  /**
   * Invoked when a backend has been chosen from the
   * persisted backends.
   */
  public backendSelected() {
    const el = this.backendService.backends.filter(x => x.url === this.backends.value);
    if (el.length > 0) {
      this.loginForm.patchValue({
        username: el[0].username || '',
        password: el[0].password || ''
      });
      this.savePassword = !!el[0].password && this.loginForm.value.password !== 'root';
    }

    // Making sure we invoke method responsible for checking if auto-auth is turned on for current backend or not.
    this.backendValueChanged();
  }

  /**
   * Invoked when the backend URL has been changed, for whatever reason.
   */
  public backendValueChanged() {

    // Verifying control actual contains any content.
    if (this.backends.value && this.backends.value !== '') {

      // Invoking backend to check if it has turned on auto-auth or not.
      this.authService.autoAuth(this.backends.value.replace(/\s/g, '').replace(/(\/)+$/,'')).subscribe((result: Response) => {

        // This will display username and password dialogs, unless backend supports automatic logins.
        this.backendHasBeenSelected = true;

        /*
         * Checking if backend allows for auto-auth, and if so allowing user to click
         * login button without providing username or password.
         */
        if (result.result === 'on') {

          // Allowing user to logging in without username/password combination.
          this.autoLogin = true;
          this.loginForm.patchValue({
            username: ''
          });

        } else {

          // Preventing user from logging in without a username/password combination.
          this.autoLogin = false;
        }
        this.loginForm.patchValue({
          backends: this.backends.value
        });
      }, (error: any) => {

        // Oops.
        this.feedbackService.showError(error);
        this.backendHasBeenSelected = false;
      });
    }
  }

  /**
   * Invoked when user requests a reset password link to be generated
   * and sent to him on email.
   * 
   * Notice, assumes username is a valid email address.
   */
  public resetPassword() {

    /*
     * Storing currently selected backend.
     */
    this.backendService.current = {
      url: this.backends.value,
    };

    // Invoking backend to request a reset password link to be sent as an email.
    this.authService.sendResetPasswordEmail(
      this.loginForm.value.username,
      location.origin).subscribe((res: Response) => {

        // Verifying request was a success.
        if (res.result === 'success') {

          // Showing some information to user.
          this.feedbackService.showInfo('Pease check your email to reset your password');

        } else {

          // Showing response from invocation to user.
          this.feedbackService.showInfo(res.result);
        }

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to login to currently selected backend.
   */
  public login() {

    /*
     * Storing currently selected backend.
     * Notice, this has to be done before we authenticate, since
     * the auth service depends upon user already having selected
     * a current backend.
     */
    let url = this.backends.value.replace(/\s/g, '').replace(/(\/)+$/,'');
    // while(url.charAt(url.length - 1) === '/') {
    //   url = url.substring(0, url.length - 1);
    // }
    this.backendService.current = {
      url: url,
      username: this.autoLogin === false || this.advanced ? this.loginForm.value.username : null,
      password: this.savePassword ? this.loginForm.value.password : null,
    };

    // Authenticating user.
    this.authService.login(
      this.autoLogin === false || this.advanced ? this.loginForm.value.username : null,
      this.autoLogin === false || this.advanced ? this.loginForm.value.password : null,
      this.savePassword).subscribe(() => {

        // Publishing user logged in message, and closing dialog.
        this.messageService.sendMessage({
          name: Messages.USER_LOGGED_IN,
        });
        this.dialogRef.close();
        // if server is not configured yet, redirect to config page after a successful login
        if (this.configService.setupStatus?.config_done === false ||
          this.configService.setupStatus?.magic_crudified === false ||
          this.configService.setupStatus?.server_keypair === false) {
          this.router.navigate(['/config']);
        }
        // if successful login while user is in register page, redirect to dashboard
        // ** this page disappears after login
        if (window.location.pathname === '/register'){
          this.router.navigate(['/']);
        }
      }, (error: any) => {

        // Oops, something went wrong.
        this.feedbackService.showError(error);
      });
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
}
