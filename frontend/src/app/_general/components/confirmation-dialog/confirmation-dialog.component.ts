
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from '../../services/general.service';

/**
 * Data model to bind towards UI in form.
 */
export interface Extra {
  details: any,
  action?: string, // if provided, then confirmation textbox will be appeared.
  fieldToBeTypedTitle?: string,
  fieldToBeTypedValue?: string,
  icon?: string
}

/**
 * Helper component to allow user to confirm some specific action, such as deleting item
 * that cannot be undone, etc.
 */
@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {

  inputValue: FormControl = new FormControl<string>('');

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title?: string,
      description?: string,
      description_extra: string,
      action_btn: string,
      close_btn: string,
      action_btn_color?: string,
      bold_description?: boolean,
      extra?: Extra}) { }

  ngOnInit() {

    this.data['title'] = this.data['title'] ?? 'Please confirm';
    this.data['description'] = this.data['description'] ?? 'Are you sure?';
    this.data['action_btn_color'] = this.data['action_btn_color'] ?? 'primary';
  }

  public confirm() {

    if ((this.data.extra && this.data.extra.details) && (this.inputValue.value !== this.data.extra.fieldToBeTypedValue || this.inputValue.value === '')) {
      this.generalService.showFeedback(this.data.extra.fieldToBeTypedTitle + ' does not match', 'errorMessage', null, 2000);
      return;
    }
    this.dialogRef.close('confirm');
  }
}
