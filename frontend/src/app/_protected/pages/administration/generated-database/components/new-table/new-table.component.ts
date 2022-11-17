import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-new-table',
  templateUrl: './new-table.component.html',
  styleUrls: ['./new-table.component.scss']
})
export class NewTableComponent implements OnInit {

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

  ngOnInit(): void {
  }

  /**
   * Invoked when name changes.
   */
  public nameChanged() {
    this.data.pkName = this.data.name + '_id';
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
  {
    value: 'auto_increment', name: 'Auto increment'
  },
  {
    value: 'varchar', name: 'Varchar'
  }
]
