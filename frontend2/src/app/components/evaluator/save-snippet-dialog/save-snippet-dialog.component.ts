
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';

/**
 * Save snippet dialog for saving snippet.
 */
@Component({
  selector: 'app-save-snippet-dialog',
  templateUrl: './save-snippet-dialog.component.html',
  styleUrls: ['./save-snippet-dialog.component.scss']
})
export class SaveSnippetDialogComponent extends BaseComponent implements OnInit {

  /**
   * Existing snippet files as returned from backend.
   */
  public files: string[] = [];

  /**
   * Filename to save snippet as.
   */
  public filename = '';

  /**
   * Creates an instance of your login dialog.
   * 
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param evaluatorService Evaluator service needed to retrieve snippet files from backend
   */
  constructor(
    protected messageService: MessageService,
    private dialogRef: MatDialogRef<SaveSnippetDialogComponent>,
    private evaluatorService: EvaluatorService) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving snippets from backend.
    this.evaluatorService.snippets().subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.hl'));
    }, (error: any) => this.showError(error));
  }

  /**
   * Returns only the filename parts from the given full path and filename.
   * 
   * @param path Complete path of file
   */
  public getFilename(path: string) {
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  /**
   * Returns filtered files according to what user has typed.
   */
  public getFiltered() {
    return this.files.filter((file: string)  => {
      const result = file.substr(file.lastIndexOf('/') + 1);
      const fileName = result.substr(0, result.lastIndexOf('.'));
      return fileName.indexOf(this.filename) !== -1;
    });
  }

  /**
   * Returns true if filename is a valid filename for snippet.
   * 
   * @param filename Filename to check
   */
  public filenameValid(filename: string) {
    for (var idx of filename) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789.-'.indexOf(idx) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Saves the snippet.
   */
  public save() {
    this.dialogRef.close(this.filename);
  }
}
