
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper componnt for allowing user to create new link tables, implying many to many
 * relationship tables.
 */
@Component({
  selector: 'app-add-link-table',
  templateUrl: './add-link-table.component.html'
})
export class LinkTableComponent {

  formData: any = {
    table1: '',
    table2: ''
  }

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<LinkTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  secondTableList() {

    if (this.formData.table1 !== '') {
      return this.data.filter((table: any) => { return table.name !== this.formData.table1.name });
    }
    return [];
  }

  create() {

    if (this.formData.table1 !== '' && this.formData.table2 !== '') {
      this.dialogRef.close(this.formData);
    } else {
      this.generalService.showFeedback('Please select both tables.', 'errorMessage');
    }
  }
}
