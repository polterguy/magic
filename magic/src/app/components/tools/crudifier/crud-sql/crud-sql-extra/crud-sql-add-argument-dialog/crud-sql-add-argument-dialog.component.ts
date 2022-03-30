
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
  types: string[] = [
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
  name = '';

  /**
   * Hyperlambda type of argument.
   */
  type = '';

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close modal dialog
   */
  constructor(private dialogRef: MatDialogRef<CrudSqlAddArgumentDialogComponent>) { }

  /**
   * Returns true if argument name is valid.
   */
  argumentValid() {
    return /^[a-z0-9_]+$/i.test(this.name);
  }

  /**
   * Invoked when user wants to add the argument,
   * having supplied a type and a name for it.
   */
  add() {
    this.dialogRef.close({
      name: this.name,
      type: this.type,
    });
  }
}
