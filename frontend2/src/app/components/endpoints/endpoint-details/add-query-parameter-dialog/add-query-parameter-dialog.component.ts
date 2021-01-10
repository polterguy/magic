
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Argument } from '../../models/argument.model';

/**
 * Dialog component for adding a query parameter to the URL of endpoint.
 */
@Component({
  selector: 'app-add-query-parameter-dialog',
  templateUrl: './add-query-parameter-dialog.component.html',
  styleUrls: ['./add-query-parameter-dialog.component.scss']
})
export class AddQueryParameterComponentDialog {

  /**
   * Model for value of query parameter.
   */
  public value: any;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog
   */
  constructor(
    private dialogRef: MatDialogRef<AddQueryParameterComponentDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Argument)
  {
    switch (data.type) {

      case 'bool':
        this.value = true;
        break;

      case 'string':
        this.value = '';
        break;

      case 'long':
      case 'int':
      case 'uint':
      case 'short':
      case 'ushort':
        this.value = 42;
        break;

      case 'date':
        this.value = new Date().toISOString();
        break;
    }
  }

  /**
   * Invoked when user wants to create a new query parameter value.
   */
  public create() {
    this.dialogRef.close(this.value);
  }
}
