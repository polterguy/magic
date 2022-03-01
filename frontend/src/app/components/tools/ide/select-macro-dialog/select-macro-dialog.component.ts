
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { FileService } from 'src/app/services/file.service';

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
  public macros: string[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to retrieve macro files from backend
   * @param dialogRef Needed to explicitly close dialog from TypeScript
   * @param data Currently selected macro
   */
  constructor(
    private fileService: FileService,
    public dialogRef: MatDialogRef<SelectMacroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Macro) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving all macro files from the backend.
    this.fileService.listFiles('/misc/ide/macros/', '.hl').subscribe((result: string[]) => {

      // Assigning result to model.
      this.macros = result;
    });
  }

  /**
   * Returns only the name of the macro to caller.
   * 
   * @param macro Full path of macro
   */
  public getMacroName(macro: string) {

    // Trying to display something resembling a friendly name.
    let result = macro.substr(macro.lastIndexOf('/') + 1);
    result = result.substr(0, result.lastIndexOf('.'));
    while (true) {
      if (result.indexOf('-') === -1) {
        break;
      }
      result = result.replace('-', ' ');
    }
    return result.substr(0, 1).toUpperCase() + result.substr(1);
  }

  /**
   * Invoked when user selects a macro.
   * 
   * @param macro Macro that was selected
   */
  public selectMacro(macro: string) {

    // Assigning model and closing dialog.
    this.data.name = macro;
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user wants to close dialog without selecting a macro.
   */
  public cancel() {

    // Closing dialog without an data associated with selection operation.
    this.dialogRef.close();
  }
}
