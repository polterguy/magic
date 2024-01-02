
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports
import { User_Extra } from '../../_models/user.model';
import { UserService } from '../../_services/user.service';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper modal dialog for allowing user to add extra field and associate with user.
 */
@Component({
  selector: 'app-add-extra-fields-dialog',
  templateUrl: './add-extra-fields-dialog.component.html'
})
export class AddExtraFieldsDialogComponent {

  constructor(
    private userService: UserService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<AddExtraFieldsDialogComponent>) { }

  save(type: string, value: string) {

    if (type === '' || value === '') {

      this.generalService.showFeedback('Please provide all fields', 'errorMessage');
      return;
    }

    let data: User_Extra = {
      type: type,
      user: this.data,
      value: value
    }

    this.generalService.showLoading();
    this.userService.addExtra(data).subscribe({

      next: (res: any) => {

        this.generalService.hideLoading();
        if (res.result === 'success') {
          this.generalService.showFeedback('New field was successfully saved', 'successMessage');
          this.dialogRef.close({ type: type, value: value })
        } else {
          this.generalService.showFeedback('Something went wrong, please try again.', 'errorMessage', 'ok', 4000)
        }
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000);
      }
    });
  }
}
