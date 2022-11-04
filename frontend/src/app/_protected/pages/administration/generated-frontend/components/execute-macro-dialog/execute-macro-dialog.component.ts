
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MacroDefinition } from '../../../../hyper-ide/_models/macro-definition.model';

// Application specific imports.

/**
 * Modal dialog allowing you to parametrise and execute a macro.
 */
@Component({
  selector: 'app-execute-macro-dialog',
  templateUrl: './execute-macro-dialog.component.html',
  styleUrls: ['./execute-macro-dialog.component.scss']
})
export class ExecuteMacroDialogComponent {

  /**
   * Creates an instance of your component.
   */
  constructor(
    public dialogRef: MatDialogRef<ExecuteMacroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MacroDefinition) {
    for (const idx of this.data.arguments) {
      if (!idx.value && idx.default) {
        idx.value = idx.default;
      }
    }
  }

  /**
   * Closes dialog without executing a macro, allowing user to select another macro.
   */
  differentMacro() {
    delete this.data.name;
    this.dialogRef.close(this.data);
  }

  /**
   * Returns true if all mandatory arguments have been given values.
   */
  canExecute() {
    return this.data.arguments.filter(x => x.mandatory && !x.value).length === 0;
  }

  /**
   * Invoked when user wants to execute macro after having decorated it.
   */
  execute() {
    this.dialogRef.close(this.data);
  }
}
