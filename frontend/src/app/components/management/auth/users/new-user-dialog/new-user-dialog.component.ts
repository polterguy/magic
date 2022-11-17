
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';
import { User } from 'src/app/_protected/pages/user-roles/_models/user.model';
import { UserService } from 'src/app/_protected/pages/user-roles/_services/user.service';

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
  username: string = '';

  /**
   * Initial password for new user.
   */
  password: string = '';

  /**
   * Whether or not password should be hidden or not.
   */
  hide = true;

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
  create() {
    this.userService.create(this.username, this.password).subscribe((res: any) => {
      this.dialogRef.close(this.username);
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Updates an existing user.
   */
  update() {
    this.userService.update({
      username: this.username,
      password: this.password
    }).subscribe(() => {
      this.dialogRef.close(this.username);
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when dialog should simply be closed without updating
   * an existing or creating a new user.
   */
   close() {
    this.dialogRef.close();
  }
}
