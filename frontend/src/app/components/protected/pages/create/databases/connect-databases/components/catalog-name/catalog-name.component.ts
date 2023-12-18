
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { SqlService } from '../../../../../../../../services/sql.service';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';

/**
 * Helper component allowing user to provide name of a new catalog he or she wants
 * to create in the specified database instance.
 */
@Component({
  selector: 'app-catalog-name',
  templateUrl: './catalog-name.component.html'
})
export class CatalogNameComponent {

  waitingCreation: boolean = false;
  name: string = '';

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private sqlService: SqlService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CatalogNameComponent>) { }

  public save() {

    if (this.name === '') {
      this.generalService.showFeedback('Name is required', 'errorMessage');
    }

    if (!this.CommonRegEx.appNameWithUppercase.test(this.name)) {
      this.generalService.showFeedback(this.CommonErrorMessages.appNameWithUppercase, 'errorMessage');
      return;
    }

    this.waitingCreation = true;

    this.sqlService.createDatabase(
      this.data.dbTypeValue,
      this.data.cStringKey,
      this.name).subscribe({
        next: () => {
          this.generalService.showFeedback('Catalog successfully created', 'successMessage');
          this.dialogRef.close();
        },
        error: (error: any) => {
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
        }
      });
  }
}
