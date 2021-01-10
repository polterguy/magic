
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

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
  public value: string;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog
   */
  constructor(private dialogRef: MatDialogRef<AddQueryParameterComponentDialog>) { }

  /**
   * Invoked when user wants to create a new query parameter value.
   */
  public create() {
    this.dialogRef.close(this.value);
  }
}
