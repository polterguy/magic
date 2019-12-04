
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

  constructor(
    public dialogRef: MatDialogRef<CreateValidatorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  createHyperlambda(e: MatSelectChange) {
    const expression = `:x:@.arguments/*/${this.data.field}`;
    switch (e.value) {

      case 'validators.url':
        this.data.hyperlambda = `${e.value}${expression}`;
        break;

      case 'validators.string':
        this.data.hyperlambda = `${e.value}${expression}
   min:int:0
   max:int:100`;
        break;

      case 'validators.regex':
        this.data.hyperlambda = `${e.value}${expression}
   regex:some-regex-here`;
        break;

      case 'validators.mandatory':
        this.data.hyperlambda = `${e.value}${expression}`;
        break;

      case 'validators.integer':
        this.data.hyperlambda = `${e.value}${expression}
   min:int:0
   max:int:100`;
        break;

      case 'validators.enum':
        this.data.hyperlambda = `${e.value}${expression}
   .:value-1
   .:value-2`;
        break;

      case 'validators.email':
        this.data.hyperlambda = `${e.value}${expression}`;
        break;

      case 'validators.date':
        this.data.hyperlambda = `${e.value}${expression}
   min:date:"2019-12-24T17:30"
   max:date:"2019-12-24T17:45"`;
        break;

    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
