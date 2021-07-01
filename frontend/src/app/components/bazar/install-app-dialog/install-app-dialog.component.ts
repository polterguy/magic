
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Class encapsulating model dialog returns.
 */
export class ModuleInstall {

  /**
   * URL of module to install.
   */
  url?: string;

  /**
   * Name of module to install.
   */
  name?: string;
}

/**
 * Modal dialog allowing user to provide the URL to a module he wants to install
 * in his backend.
 */
@Component({
  selector: 'app-install-app-dialog',
  templateUrl: './install-app-dialog.component.html',
  styleUrls: ['./install-app-dialog.component.scss']
})
export class InstallAppDialogComponent {

  /**
   * Creates an instance of your component.
   */
  public constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModuleInstall,
    private dialogRef: MatDialogRef<InstallAppDialogComponent>) { }

  /**
   * Invoked when URL is changed.
   */
  public urlChanged() {

    // Trying to intelligently figure out the module's name.
    if (this.data.url && this.data.url.indexOf('?app=') > 0) {

      // Probably another Magic server serving this file, hence we can "intelligently" figure out the module name.
      let name = this.data.url.substr(this.data.url.indexOf('?app=') + 5);
      name = name.substr(0, name.indexOf('-v'));
      this.data.name = name;
    }
  }

  /**
   * Invoked when user clicks the install button.
   */
  public install() {

    // Closing dialog passing in data to caller.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user wants to close dialog without installing any modules.
   */
  public close() {

    // Simply closing dialog without passsing in any data to caller.
    this.dialogRef.close();
  }
}
