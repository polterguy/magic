
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system types of imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-redirect2hub',
  templateUrl: './redirect2hub.component.html'
})
export class Redirect2hubComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to programmatically close dialog
   */
  constructor(private dialogRef: MatDialogRef<Redirect2hubComponent>) {}

  /**
   * Invoked when user wants to redirect to HUB to deploy frontend.
   */
  deploy() {
    this.dialogRef.close();
  }

  /**
   * Returns root URL of application
   */
  getRootUrl() {
    return window.location.href.indexOf('dev-dashboard') !== -1 ? 'dev-hub' : 'hub';
  }
}
