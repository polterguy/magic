
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelectChange } from '@angular/material';

export interface DialogData {
  field: string;
  hyperlambda: string;
}

@Component({
  templateUrl: 'create-validator-dialog.html',
})
export class CreateValidatorDialogComponent {

  private validatorType: string = null;
  private min = 0;
  private max = 100;
  private regex = '';
  private enumValues = '';
  private dateMin = new Date();
  private dateMax = new Date();

  constructor(
    public dialogRef: MatDialogRef<CreateValidatorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  createHyperlambda(e: MatSelectChange) {
    this.parseValidator();
  }

  valueChanged() {
    this.parseValidator();
  }

  parseValidator() {
    const expression = `:x:@.arguments/*/${this.data.field}`;
    switch (this.validatorType) {

      case 'validators.url':
        this.data.hyperlambda = `${this.validatorType}${expression}`;
        break;

      case 'validators.string':
        this.data.hyperlambda = `${this.validatorType}${expression}
   min:int:${this.min}
   max:int:${this.max}`;
        break;

      case 'validators.regex':
        this.data.hyperlambda = `${this.validatorType}${expression}
   regex:${this.regex}`;
        break;

      case 'validators.mandatory':
        this.data.hyperlambda = `${this.validatorType}${expression}`;
        break;

      case 'validators.integer':
        this.data.hyperlambda = `${this.validatorType}${expression}
   min:int:${this.min}
   max:int:${this.max}`;
        break;

      case 'validators.enum':
        const values = this.enumValues.split(',');
        let buffer = `${this.validatorType}${expression}`;
        for (let idx = 0; idx < values.length; idx++) {
          buffer += '\r\n   :' + values[idx].trim();
        }
        this.data.hyperlambda = buffer;
        break;

      case 'validators.email':
        this.data.hyperlambda = `${this.validatorType}${expression}`;
        break;

      case 'validators.date':
        this.data.hyperlambda = `${this.validatorType}${expression}
   min:date:"${this.dateMin}"
   max:date:"${this.dateMax}"`;
        break;

    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
