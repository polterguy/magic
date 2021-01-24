
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { User } from 'src/app/components/auth/models/user.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { UserService } from 'src/app/components/auth/services/user.service';

/**
 * Modal dialog component for creating a new user and
 * editing password of an existing user.
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
   * @param userService Used to create a new user
   * @param feedbackService Used to display feedback to user
   * @param dialogRef Dialog reference used to close dialog
   * @param data If updating user, this is the user we're updating
   */
  constructor(
    private userService: UserService,
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
