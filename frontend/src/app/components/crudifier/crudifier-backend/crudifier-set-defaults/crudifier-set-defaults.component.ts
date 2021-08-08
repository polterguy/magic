
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Modal dialog allowing you to apply default settings for all tables in
 * your currently selected database.
 */
@Component({
  selector: 'app-crudifier-set-defaults',
  templateUrl: './crudifier-set-defaults.component.html',
  styleUrls: ['./crudifier-set-defaults.component.scss']
})
export class CrudifierSetDefaultsComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog from code.
   * @param data Input data to bind model towards
   */
  constructor(
    private dialogRef: MatDialogRef<CrudifierSetDefaultsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  /**
   * Invoked when user wants to apply his settings to all tables in currently selected database.
   */
  public apply() {

    // Closing dialog signalling to caller he needs to update his defaults.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user wants to close dialog WITHOUT applying default settings.
   */
  public close() {

    // Closing dialog without sending in data.
    this.dialogRef.close();
  }
}
