
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { SqlService } from 'src/app/services/sql.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Load snippet dialog for loading saved snippets from the backend.
 */
@Component({
  selector: 'app-load-sql-dialog',
  templateUrl: './load-sql-dialog.component.html',
  styleUrls: ['./load-sql-dialog.component.scss']
})
export class LoadSqlDialogComponent extends BaseComponent implements OnInit {

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
   * @param sqlService Needed to retrieve snippets from backend
   * @param messageService Dependency injected message service to publish information from component to subscribers
   * @param data Input data, more specifically the database type the user is currently using
   * @param dialogRef Needed to be able to close dialog as user selects a snippet
   */
  constructor(
    private sqlService: SqlService,
    protected messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<LoadSqlDialogComponent>) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving snippets from backend.
    this.sqlService.snippets(this.data).subscribe((files: string[]) => {
      this.files = files.filter(x => x.endsWith('.sql'));
    }, (error: any) => this.showError(error));
  }

  /**
   * Returns files that matches current filter, if any.
   */
  public getFiles() {
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
    this.dialogRef.close(this.getFilename(filename));
  }
}
