
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Component that asks user for a release date, allowing a moderator
 * to imprison a user for some specified amount of time, such that the user
 * cannot access magic before that time passes.
 */
@Component({
  selector: 'app-jail-user-dialog',
  templateUrl: './jail-user-dialog.component.html',
  styleUrls: ['./jail-user-dialog.component.scss']
})
export class JailUserDialogComponent {

  /**
   * Selected release date for user.
   */
  public releaseDate = new Date();

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialogue explicitly
   */
  constructor(private dialogRef: MatDialogRef<JailUserDialogComponent>) { }

  /**
   * Invoked when user has selected a release date for user.
   */
  public imprison() {

    // Closing dialogue, passing in release date to caller.
    this.dialogRef.close(this.releaseDate);
  }
}
