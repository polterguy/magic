
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { User } from '../../_models/user.model';
import { UserService } from '../../_services/user.service';

/**
 * Helper modal dialog to allow user to change password of users in the system.
 */
@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html'
})
export class ChangePasswordDialogComponent {

  /**
   * Stores the given password.
   */
  public password: string = '';

  /**
   * Toggles password's visibility.
   */
  public showPassword: boolean = false;

  /**
   * Sets to true while password is saving.
   */
  public isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private userService: UserService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: User) { }

  /**
   * Invokes endpoint to save the new password.
   */
  public save() {
    if (this.password !== '') {
      this.isLoading = true;
      this.userService.update({
        username: this.data.username,
        password: this.password,
      }).subscribe({
        next: () => {
          this.generalService.showFeedback('New password is saved successfully', 'successMessage', 'Ok', 3000);
          this.isLoading = false;
          this.dialogRef.close();
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
      });
    } else {
      this.generalService.showFeedback('Please give a password to save.')
    }
  }
}
