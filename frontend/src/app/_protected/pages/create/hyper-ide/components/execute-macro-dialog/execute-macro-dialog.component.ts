
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MacroDefinition } from '../../models/macro-definition.model';

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
    private generalService: GeneralService,
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
  private canExecute() {
    return this.data.arguments.filter(x => x.mandatory && !x.value).length === 0;
  }

  /**
   * Invoked when user wants to execute macro after having decorated it.
   */
  execute() {
    if (!this.canExecute()) {
      this.generalService.showFeedback('Please provide the necessary details.', 'errorMessage');
      return;
    }
    this.dialogRef.close(this.data);
  }
}
