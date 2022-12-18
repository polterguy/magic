
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Argument } from 'src/app/_protected/pages/manage/endpoints/_models/argument.model';

@Component({
  selector: 'app-add-argument-dialog',
  templateUrl: './add-argument-dialog.component.html'
})
export class AddArgumentDialogComponent implements OnInit {

  /**
  * Types of argument user can add.
  */
  public types: string[] = Types;

  /**
   * Name of argument.
   */
  public name = '';

   /**
    * Hyperlambda type of argument.
    */
  public selectedType = '';

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<AddArgumentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Argument[]) { }

  ngOnInit() {
    this.selectedType = 'string';
  }

  private validateUrlName() {
    return this.CommonRegEx.appNames.test(this.name);
  }

  public add() {
    if (!this.validateUrlName()) {
      this.generalService.showFeedback('Please give a proper name.', 'errorMessage');
      return;
    }
    if (this.data.filter(x => x.name === this.name).length > 0) {
      this.generalService.showFeedback('Argument already exists.', 'errorMessage');
      return;
    }
    this.dialogRef.close({
      name: this.name,
      type: this.selectedType
    })
  }
}

const Types: string[] = [
 'string',
 'long',
 'ulong',
 'date',
 'bool',
 'int',
 'uint',
 'short',
 'ushort',
];
