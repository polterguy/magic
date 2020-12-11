
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';

/**
 * Save snippet dialog for saving snippets to the backend for later.
 */
@Component({
  selector: 'app-save-snippet-dialog',
  templateUrl: './save-snippet-dialog.component.html',
  styleUrls: ['./save-snippet-dialog.component.scss']
})
export class SaveSnippetDialogComponent extends BaseComponent implements OnInit {

  /**
   * Existing snippet files as returned from backend.
   * 
   * Needed to make autocompleter working allowing user to overwrite previously saved snippet.
   */
  public files: string[] = [];

  /**
   * Creates an instance of your login dialog.
   * 
   * @param evaluatorService Evaluator service needed to retrieve snippet files from backend
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param data Filename to intially populate filename textbox with. Typically only supplied if you previously loaded a file.
   */
  constructor(
    private evaluatorService: EvaluatorService,
    protected messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: string) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving snippets from backend.
    this.evaluatorService.snippets().subscribe((files: string[]) => {

      // Excluding all files that are not Hyperlambda files.
      this.files = files.filter(x => x.endsWith('.hl'));

    }, (error: any) => this.showError(error));
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   * 
   * @param path Complete path of file
   */
  public getFilename(path: string) {

    // Removing path and extension, returning only filename.
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  /**
   * Returns filtered files according to what user has typed.
   */
  public getFiltered() {

    // Filtering files according such that only filtered files are returned.
    return this.files.filter((idx: string)  => {
      return this.getFilename(idx).indexOf(this.data) !== -1;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   */
  public filenameValid() {

    // A valid filename only contains [a-z], [0-9], '.' and '-'.
    for (var idx of this.data) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-'.indexOf(idx) === -1) {
        return false;
      }
    }
    return true;
  }
}
