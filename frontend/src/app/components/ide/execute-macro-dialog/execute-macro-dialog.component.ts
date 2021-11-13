
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { MacroDefinition } from '../../files/services/models/macro-definition.model';

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
  public constructor(
    public dialogRef: MatDialogRef<ExecuteMacroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MacroDefinition) {

      // Populating default values for arguments having default values.
      for (const idx of this.data.arguments) {
        if (!idx.value && idx.default) {
          idx.value = idx.default;
        }
      }
    }

  /**
   * Closes dialog without executing a macro, allowing user to select another macro.
   */
  public differentMacro() {

    // Simply closing dialog without a name for macro.
    delete this.data.name;
    this.dialogRef.close(this.data);
  }

  /**
   * Closes dialog completely.
   */
   public close() {

    // Simply closing dialog without a name for macro.
    this.dialogRef.close();
  }

  /**
   * Returns true if all mandatory arguments have been given values.
   */
  public canExecute() {

    // Returns true if all mandatory arguments have values.
    return this.data.arguments.filter(x => x.mandatory && !x.value).length === 0;
  }

  /**
   * Invoked when user wants to execute macro after having decorated it.
   */
  public execute() {

    // Closing dialog passing in data to caller.
    this.dialogRef.close(this.data);
  }
}
