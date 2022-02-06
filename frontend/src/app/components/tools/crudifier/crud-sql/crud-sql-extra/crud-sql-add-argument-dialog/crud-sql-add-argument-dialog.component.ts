
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Modal dialog allowing the user to create a new argument for an SQL type of endpoint.
 */
@Component({
  selector: 'app-crud-sql-add-argument-dialog',
  templateUrl: './crud-sql-add-argument-dialog.component.html',
})
export class CrudSqlAddArgumentDialogComponent {

  /**
   * Types of argument user can add.
   */
  public types: string[] = [
    'string',
    'long',
    'ulong',
    'date',
    'bool',
    'int',
    'uint',
    'short',
    'ushort',
  ];

  /**
   * Name of argument.
   */
  public name = '';

  /**
   * Hyperlambda type of argument.
   */
  public type = '';

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close modal dialog
   */
  constructor(private dialogRef: MatDialogRef<CrudSqlAddArgumentDialogComponent>) { }

  /**
   * Returns true if argument name is valid.
   */
  public argumentValid() {
    return /^[a-z0-9_]+$/i.test(this.name);
  }

  /**
   * Invoked when user wants to add the argument,
   * having supplied a type and a name for it.
   */
  public add() {

    // Closing dialogue, passing in argument to caller.
    this.dialogRef.close({
      name: this.name,
      type: this.type,
    });
  }
}
