
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Argument } from '../../../../../_protected/pages/administration/generated-endpoints/_models/argument.model';

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

  /**
   * Old value for query argumant, if any.
   */
  old: any;
}

/**
 * Dialog component for adding a query parameter to the URL of endpoint.
 */
@Component({
  selector: 'app-add-query-parameter-dialog',
  templateUrl: './add-query-parameter-dialog.component.html',
  styleUrls: ['./add-query-parameter-dialog.component.scss']
})
export class AddQueryParameterDialogComponent {

  /**
   * Model for value of query parameter.
   */
  value: any;

  /**
   * Data model for operator types of arguments.
   */
  operators: string[] = [
    'or',
    'and',
  ];

  /**
   * Possible sort order directions for sorting result.
   */
  directions: string[] = [
    'asc',
    'desc',
  ];

  /**
   * Columns user can sort endpoint by.
   */
  orders: string[] = [];

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be able to close dialog
   */
  constructor(
    private dialogRef: MatDialogRef<AddQueryParameterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ArgumentModel) {

    if (data.argument.name === 'order' && data.argument.type === 'string') {
      this.orders = this.data.all.filter(x => x.name.endsWith('.eq')).map(x => x.name.substring(0, x.name.length - 3));
      this.value = this.data.old ?? '';
    } else if (data.argument.name === 'direction' && data.argument.type === 'string') {
      this.value = this.data.old ?
        this.directions.filter(x => x === this.data.old)[0] :
        this.directions.filter(x => x === 'asc')[0];
    } else if (data.argument.name === 'operator' && data.argument.type === 'string') {
      this.value = this.data.old ?
        this.operators.filter(x => x === this.data.old)[0] :
        this.operators.filter(x => x === 'and')[0];
    } else {
      switch (data.argument.type) {

        case 'bool':
          this.value = this.data.old || true;
          break;

        case 'string':
          this.value = this.data.old || '';
          break;

        case 'long':
        case 'int':
        case 'uint':
        case 'short':
        case 'ushort':
          this.value = this.data.old || 42;
          break;

        case 'date':
          this.value = this.data.old || new Date().toISOString();
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
