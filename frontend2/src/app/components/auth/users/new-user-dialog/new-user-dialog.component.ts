
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { User } from 'src/app/components/auth/models/user.model';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { UserService } from 'src/app/components/auth/services/user.service';
import { AuthenticateResponse } from '../../models/authenticate-response.model';

/**
 * Modal dialog component for creating a new user.
 */
@Component({
  selector: 'app-new-user',
  templateUrl: './new-user-dialog.component.html'
})
export class NewUserDialogComponent {

  /**
   * Username for new user.
   */
  public username: string = '';

  /**
   * Initial password for new user.
   */
  public password: string = '';

  /**
   * Creates an instance of your component.
   * 
   * @param platformLocation Needed to create login link
   * @param clipboard Needed to put login link for users into clipboard
   * @param userService Used to create a new user
   * @param feedbackService Used to display feedback to user
   * @param dialogRef Dialog reference used to close dialog
   * @param data If updating user, this is the user we're updating
   */
  constructor(
    private platformLocation: PlatformLocation,
    private clipboard: Clipboard,
    private userService: UserService,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<NewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User) {
    if (this.data) {
      this.username = data.username;
    }
  }

  /**
   * Creates a new user.
   */
  public create() {

    // Invoking backend to create the new user.
    this.userService.create(this.username, this.password).subscribe((res: any) => {

      // Success! User created.
      this.dialogRef.close(this.username);
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to create a login link for user.
   */
  public generateLoginLink() {

    // Creates a login link by invoking backend.
    this.userService.generateLoginLink(this.username).subscribe((result: AuthenticateResponse) => {

      // Creating an authentication URL, and putting it on the clipboard, giving user some feedback in the process.
      const location: any = this.platformLocation;
      const url = location.location.origin.toString() +
        '/authenticate?token=' +
        encodeURIComponent(result.ticket) +
        '&username=' +
        encodeURIComponent(this.username) +
        '&url=' +
        encodeURIComponent(this.backendService.current.url);

      this.clipboard.copy(url);
      this.feedbackService.showInfo('Login link for user can be found on your clipboard');
      this.dialogRef.close();
    });
  }

  /**
   * Updates an existing user.
   */
  public update() {

    // Invoking backend to create the new user.
    this.userService.update({
      username: this.username,
      password: this.password
    }).subscribe((res: any) => {

      // Success! User created.
      this.dialogRef.close(this.username);
    }, (error: any) => this.feedbackService.showError(error));
  }
}
