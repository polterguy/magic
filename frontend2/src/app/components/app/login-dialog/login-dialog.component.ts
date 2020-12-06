
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { BaseComponent } from '../../base.component';
import { Messages } from 'src/app/models/message.model';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { AuthenticateResponse } from 'src/app/models/authenticate-response.model';
import { LoaderInterceptor } from 'src/app/services/interceptors/loader.interceptor';

/**
 * Login dialog allowing user to login to a backend of his choice.
 */
@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent extends BaseComponent implements OnInit {

  public backends: FormControl = null;
  public filteredBackends: Observable<string[]>;
  public username: string = '';
  public password: string = '';
  public savePassword: boolean = false;

  /**
   * Creates an instance of your login dialog.
   * 
   * @param router Router service to redirect and check current route
   * @param configService Configuration service used to determine if system has been setup if root user logs in
   * @param loaderInterceptor Used for explicitly turning on/off load spinner animation
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param authService Dependency injected authentication and authorisation service
   * @param backendService Service to keep track of currently selected backend
   * @param dialogRef Reference to self, to allow for closing dialog as user has successfully logged in
   */
  constructor(
    private router: Router,
    private configService: ConfigService,
    private loaderInterceptor: LoaderInterceptor,
    protected messageService: MessageService,
    public authService: AuthService,
    public backendService: BackendService,
    public dialogRef: MatDialogRef<LoginDialogComponent>) {
      super(messageService);
    }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {
    this.backends = new FormControl();
    this.backends.setValue('');
    this.filteredBackends = this.backends.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filter(value))
      );
  }

  /**
   * Shows a security warning about password to user.
   */
  public showSecurityWarning() {
    this.messageService.sendMessage({
      name: Messages.SHOW_INFO,
      content: 'Clicking the login button will transmit your password in clear text'
    });
  }

  /**
   * Invoked when a backend has been chosen from the
   * persisted backends.
   */
  public backendSelected() {
    const el = this.backendService.backends.filter(x => x.url === this.backends.value);
    if (el.length > 0) {
      this.username = el[0].username;
      this.password = el[0].password;
      this.savePassword = !!el[0].password && this.password !== 'root';
    }
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
    this.backendService.current = {
      url: this.backends.value,
      username: this.username,
      password: this.savePassword ? this.password : null,
    };

    // Authenticating user.
    this.loaderInterceptor.increment();
    this.authService.login(
      this.username,
      this.password,
      this.savePassword).subscribe((res: AuthenticateResponse) => {

        /*
         * Success!
         * Checking if user is root, and system has not been setup quite yet,
         * and if so, we redirect user to config component.
         */
        if (this.authService.roles().indexOf('root') !== -1 && this.router.url !== '/config') {

          // Checking status to see if we've setup system.
          this.configService.status().subscribe((res: Status) => {
            this.loaderInterceptor.decrement();
            if (!res.magic_crudified || !res.server_keypair || !res.setup_done) {
              this.router.navigate(['/config']);
            }
          }, (error: any) => {
            this.showError(error);
            this.loaderInterceptor.decrement();
          });
        } else {
          this.loaderInterceptor.decrement();
        }

        // Publishing user logged in message, and closing dialog.
        this.messageService.sendMessage({
          name: Messages.USER_LOGGED_IN,
        });
        this.dialogRef.close();

      }, (error: any) => {

        // Oops, something went wrong.
        this.loaderInterceptor.decrement();
        this.messageService.sendMessage({
          name: Messages.SHOW_ERROR,
          content: error,
        });
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
      .filter(x => x.url.includes(value))
      .map(x => x.url);
  }
}
