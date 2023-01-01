
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';

export interface NewTableModel {
  name: string;
  pkName: string;
  pkType: string;
  pkLength: number;
  pkDefault: string;
}

/**
 * Helper component allowing user to create a new table, and its associated primary key.
 */
@Component({
  selector: 'app-add-table',
  templateUrl: './add-table.component.html'
})
export class NewTableComponent {

  data: NewTableModel = {
    name: '',
    pkName: '',
    pkType: 'auto_increment',
    pkLength: 10,
    pkDefault: '',
  }
  primaryKeyTypeList: any = PkType;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<NewTableComponent>) { }

  nameChanged() {

    // Avoiding plural form in case user types in English plural for for entity
    let name = this.data.name;
    if (name.endsWith('s')) {
      name = name.substring(0, name.length - 1);
    }

    if (name === '') {
      this.data.pkName = '';
      return;
    }
    this.data.pkName = name + '_id';
  }

  create() {

    if (!this.validateName()) {
      this.generalService.showFeedback('Invalid name of table or primary key', 'errorMessage');
      return;
    }

    this.dialogRef.close(this.data);
  }

  /*
   * Private helper methods.
   */

  private validateName() {
    return this.CommonRegEx.appNameWithUppercase.test(this.data.name) &&
      this.CommonRegEx.appNameWithUppercase.test(this.data.pkName) &&
      this.data.pkLength > 3;
  }
}

const PkType: any = [
  { value: 'auto_increment', name: 'Auto increment' },
  { value: 'varchar', name: 'Varchar' }
]
