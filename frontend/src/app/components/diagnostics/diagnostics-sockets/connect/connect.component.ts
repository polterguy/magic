
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Subscribe to socket messages modal dialog, allowing user to provide a message name
 * that he wants to create a socket subscription for.
 */
@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html'
})
export class ConnectComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog
   * @param data Injected data being message name of message returned as dialog is closed
   */
  constructor(
    private dialogRef: MatDialogRef<ConnectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  /**
   * Invoked when user wants to subscribe to the specified message.
   */
  public connect() {

    // Closing dialog making sure we provide message name to caller.
    this.dialogRef.close(this.data);
  }
}
