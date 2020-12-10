
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
 * Login dialog allowing user to login to a backend of his choice.
 */
@Component({
  selector: 'app-load-snippet-dialog',
  templateUrl: './load-snippet-dialog.component.html',
  styleUrls: ['./load-snippet-dialog.component.scss']
})
export class LoadSnippetDialogComponent extends BaseComponent implements OnInit {

  /**
   * Snippet files as returned from backend.
   */
  public files: string[] = [];

  /**
   * Filter for filtering files to display.
   */
  public filter: string = '';

  /**
   * Creates an instance of your login dialog.
   * 
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param evaluatorService Evaluator service needed to retrieve snippet files from backend
   */
  constructor(
    protected messageService: MessageService,
    private dialogRef: MatDialogRef<LoadSnippetDialogComponent>,
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
    });
  }

  /**
   * Returns files that matches current filter, if any.
   */
  getFiles() {
    if (this.filter === '') {
      return this.files;
    } else {
      return this.files.filter(x => this.getFilename(x).indexOf(this.filter) !== -1);
    }
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
   * Invoked when user selects a file.
   */
  public select(filename: string) {
    this.dialogRef.close(filename);
  }
}
