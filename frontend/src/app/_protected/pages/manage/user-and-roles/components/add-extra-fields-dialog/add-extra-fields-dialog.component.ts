
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { User_Extra } from '../../_models/user.model';
import { UserService } from '../../_services/user.service';

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

  public save(type: string, value: string) {
    if (type === '' || value === '') {
      this.generalService.showFeedback('Please provide all fields', 'errorMessage');
      return;
    }
    let data: User_Extra = {
      type: type,
      user: this.data,
      value: value
    }
    this.userService.addExtra(data).subscribe({
      next: (res: any) => {
        if (res.result === 'success') {
          this.generalService.showFeedback('New field is saved successfully.', 'successMessage');
          this.dialogRef.close({ type: type, value: value })
        } else {
          this.generalService.showFeedback('Something went wrong, please try again.', 'errorMessage', 'ok', 4000)
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000)
    });
  }
}
