
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { CrudifyService } from 'src/app/services/crudify-service';

export interface DialogData {
  field: string;
  hyperlambda: string;
}

@Component({
  templateUrl: 'create-validator-dialog.html',
})
export class CreateValidatorDialogComponent implements OnInit {

  public validatorType: string = null;
  public min = 0;
  public max = 100;
  public regex = '';
  public enumValues = '';
  public dateMin = new Date();
  public dateMax = new Date();
  public reactors: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateValidatorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private crudifyService: CrudifyService) { }

  ngOnInit() {
    this.crudifyService.getInputReactors().subscribe(res => {
      for (const idx of res.native) {
        this.reactors.push({
          name: idx,
          dynamic: false,
        });
      }
      for (const idx of res.dynamic) {
        this.reactors.push({
          name: idx,
          dynamic: true,
        });
      }
    });
  }

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

      default:
        this.data.hyperlambda = `eval:x:+
signal:${this.validatorType}
   reference:x:@.arguments/*/${this.data.field}`;
        break;

    }
  }

  close() {
    this.dialogRef.close();
  }
}
