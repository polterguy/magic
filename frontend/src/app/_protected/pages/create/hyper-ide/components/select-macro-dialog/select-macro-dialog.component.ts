
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { GeneralService } from 'src/app/_general/services/general.service';
import { FileService } from '../../_services/file.service';

/**
 * Encapsulating a single macro.
 */
export class Macro {

  /**
   * Name of macro user selected.
   */
  name: string;
}

/**
 * Modal dialog allowing user to select pre defined macro from backend.
 */
@Component({
  selector: 'app-select-macro-dialog',
  templateUrl: './select-macro-dialog.component.html',
  styleUrls: ['./select-macro-dialog.component.scss']
})
export class SelectMacroDialogComponent implements OnInit {

  /**
   * All available macros from backend.
   */
  macros: string[] = [];

  /**
   * Creates an instance of your component.
   *
   * @param fileService Needed to retrieve macro files from backend
   * @param generalService Needed to provide feedback to user
   * @param dialogRef Needed to explicitly close dialog from TypeScript
   * @param data Currently selected macro
   */
  constructor(
    private fileService: FileService,
    private generalService: GeneralService,
    public dialogRef: MatDialogRef<SelectMacroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Macro) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.fileService.listFiles('/misc/ide/macros/', '.hl').subscribe({
      next: (result: string[]) => {
        this.macros = result;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')});
  }

  /**
   * Returns only the name of the macro to caller.
   *
   * @param macro Full path of macro
   */
  getMacroName(macro: string) {
    let result = macro.substring(macro.lastIndexOf('/') + 1);
    result = result.substring(0, result.lastIndexOf('.'));
    while (true) {
      if (result.indexOf('-') === -1) {
        break;
      }
      result = result.replace('-', ' ');
    }
    return result.substring(0, 1).toUpperCase() + result.substring(1);
  }

  /**
   * Invoked when user selects a macro.
   *
   * @param macro Macro that was selected
   */
  selectMacro(macro: string) {
    this.data.name = macro;
    this.dialogRef.close(this.data);
  }
}
