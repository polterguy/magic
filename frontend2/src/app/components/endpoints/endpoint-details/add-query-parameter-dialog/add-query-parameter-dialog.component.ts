
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Argument } from '../../models/argument.model';

/**
 * Model class for dialog.
 */
export class ArgumentModel {

  /**
   * Argument we're currently creating a value for.
   */
  argument: Argument;

  /**
   * All arguments for endpoint.
   */
  all: Argument[];
}

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
   * Data model for operator types of arguments.
   */
  public operators: string[] = [
    'or',
    'and',
  ];

  /**
   * Possible sort order directions for sorting result.
   */
  public directions: string[] = [
    'asc',
    'desc',
  ];

  /**
   * Columns user can sort endpoint by.
   */
  public orders: string[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog
   */
  constructor(
    private dialogRef: MatDialogRef<AddQueryParameterComponentDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ArgumentModel)
  {
    // Checking if argument has custom handler.
    if (data.argument.name === 'order' && data.argument.type === 'string') {

      // Populating orders field.
      this.orders = this.data.all.filter(x => x.name.endsWith('.eq')).map(x => x.name.substr(0, x.name.length - 3));
      this.value = this.orders[0];

    } else if (data.argument.name === 'direction' && data.argument.type === 'string') {

      // Defaulting sort direction to 'asc' (ascending).
      this.value = this.directions.filter(x => x === 'asc')[0];

    } else if (data.argument.name === 'operator' && data.argument.type === 'string') {

      // Defaulting logical operator to 'or'
      this.value = this.operators.filter(x => x === 'and')[0];

    } else {

      // Making sure we create a sane default value, according to type of argument.
      switch (data.argument.type) {

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
  }

  /**
   * Invoked when user wants to create a new query parameter value.
   */
  public create() {
    this.dialogRef.close(this.value);
  }
}
