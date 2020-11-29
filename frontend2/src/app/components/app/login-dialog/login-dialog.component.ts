
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { Messages } from 'src/app/models/message.model';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message-service';

/**
 * Login dialog allowing user to login to a backend of his choice.
 */
@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  public backends: FormControl = null;
  public filteredBackends: Observable<string[]>;
  public username: string = '';
  public password: string = '';
  public savePassword: boolean = false;

  /**
   * Creates an instance of your login dialog.
   * 
   * @param messageService Dependency injected message service to publish information from component to subscribers.
   * @param authService Dependency injected authentication and authorisation service.
   * @param dialogRef Reference to self, to allow for closing dialog as user has successfully logged in
   */
  constructor(
    private messageService: MessageService,
    public authService: AuthService,
    public dialogRef: MatDialogRef<LoginDialogComponent>) { }

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
      name: Messages.INFO,
      content: 'Clicking the Login button will transmit your password in clear text since you are not connected to your backend over a TLS connection'
    });
  }

  /**
   * Invoked when a backend has been chosen from the
   * persisted backends.
   */
  public backendChosen() {
    if (this.username !== '' || this.password !== '') {
      return;
    }
    const el = this.authService.backends.filter(x => x.url === this.backends.value);
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
    this.authService.login(
      this.backends.value,
      this.username,
      this.password,
      this.savePassword).subscribe(res => {
        this.messageService.sendMessage({
          name: Messages.INFO,
          content: 'You were successfully authenticated towards your backend'
        });
        this.dialogRef.close();
      }, error => {
        this.messageService.sendMessage({
          name: Messages.ERROR,
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
    return this.authService.backends
      .filter(x => x.url.includes(value))
      .map(x => x.url);
  }
}
