
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { FeedbackService } from 'src/app/services/feedback.service';

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
   * @param userService Used to create a new user
   * @param dialogRef Dialog reference used to close dialog
   * @param data If updating user, this is the user we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<NewUserDialogComponent>,
    private feedbackService: FeedbackService,
    private userService: UserService,
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
