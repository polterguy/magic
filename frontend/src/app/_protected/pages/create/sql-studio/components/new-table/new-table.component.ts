
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
  selector: 'app-new-table',
  templateUrl: './new-table.component.html'
})
export class NewTableComponent {

  /**
   * Name of table.
   */
  public data: NewTableModel = {
    name: '',
    pkName: '',
    pkType: 'auto_increment',
    pkLength: 10,
    pkDefault: '',
  }

  primaryKeyTypeList: any = PkType;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<NewTableComponent>) { }

  /**
   * Invoked when name changes.
   */
  public nameChanged() {

    // Avoiding plural form in case user types in English plural for for entity
    let name = this.data.name;
    if (name.endsWith('s')) {
      name = name.substring(0, name.length - 1);
    }
    this.data.pkName = name + '_id';
  }

  public create() {
    if (!this.validateUrlName()) {
      this.generalService.showFeedback('Invalid input.', 'errorMessage');
      return;
    }

    this.dialogRef.close(this.data);
  }

  private validateUrlName() {
    return this.CommonRegEx.appNameWithUppercase.test(this.data.name) && this.CommonRegEx.appNameWithUppercase.test(this.data.pkName) && this.data.pkLength > 9;
  }
}

const PkType: any = [
  { value: 'auto_increment', name: 'Auto increment' },
  { value: 'varchar', name: 'Varchar' }
]
