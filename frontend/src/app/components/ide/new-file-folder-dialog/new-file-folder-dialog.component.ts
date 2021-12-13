
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Template } from '../../../models/template.model';
import { FileService } from '../../files/services/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Helper class for passing parameters in and out of modal dialog.
 */
export class FileObject {

  /**
   * If true, the user wants to create a folder, otherwise a file.
   */
  isFolder: boolean;

  /**
   * Name of file object user wants to create.
   */
  name: string;

  /**
   * Path where user wants to create file object.
   */
  path: string;

  /**
   * Template file's content when creating a file.
   */
  template: string;

  /**
   * All existing folders in system.
   */
   folders: string[];
  
  /**
   * All existing files in system.
   */
   files: string[];
}

/**
 * Component for creating a new file system object, either a folder or a file.
 */
@Component({
  selector: 'app-new-file-folder-dialog',
  templateUrl: './new-file-folder-dialog.component.html',
  styleUrls: ['./new-file-folder-dialog.component.scss']
})
export class NewFileFolderDialogComponent implements OnInit {

  /**
   * Templates user can create file from.
   */
  public templates: Template[] = [];

  /**
   * Which template user has currently selected.
   */
  public activeTemplate: Template = null;

  /**
   * Whether or not we should attempt to intelligently filter templates or not.
   */
  public filterTemplates: boolean = true;

  /**
   * Element wrapping name input.
   */
  @ViewChild('fileName') fileName: ElementRef;

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to retrieve templates from backend
   * @param feedbackService Needed to display errors and such to the user
   * @param data File object type and name
   */
  constructor(
    private fileService: FileService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: FileObject) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Invoking backend to retrieve templates.
    this.fileService.listFiles('/misc/ide/templates/').subscribe((result: string[]) => {

      // Assigning result to model.
      this.templates = result.map(x => {
        return {
          name: x,
        }
      });
    });
  }

  /**
   * Returns only filename for specified path.
   * 
   * @param path Full path of file we should return filename for
   */
  public getFileName(path: string) {
    return path.substr(path.lastIndexOf('/') + 1);
  }

  /**
   * Returns the relevant templates according to which folder is currently active.
   */
  public getTemplates() {

    // Checking if intelligent filtering is turned on.
    if (!this.filterTemplates) {

      // No filtering of templates should be performed.
      return this.templates;
    }

    // Handling special cases filtering out irrelevant templates.
    switch (this.data.path) {

      // Default result.
      default:

        /*
         * Figuring out which files we can legally create here.
         *
         * We do this by checking semantically what type of folder we're within,
         * dynamically populating the select list, according to what files user is
         * legally allowed to create.
         */
        const splits = this.data.path.split('/');

        /*
         * Default return value.
         *
         * Notice, we allow user to create any Markdown type of files in any folder.
         */
        let result: Template[] = this.templates.filter(x => x.name.endsWith('.md'));

        // Checking if we can create HTTP endpoints.
        const canCreateHttpEndpoint =
          splits.length >= 4 &&
          splits[1] === 'modules' &&
          splits.filter(x => x.indexOf('.') !== -1).length === 0;
        if (canCreateHttpEndpoint) {

          // Concatenating all HTTP endpoint types of Hyperlambda files.
          result = result.concat(
            this.templates.filter(x =>
              x.name.endsWith('.delete.hl') ||
              x.name.endsWith('.post.hl') ||
              x.name.endsWith('.put.hl') ||
              x.name.endsWith('.get.hl') ||
              x.name.endsWith('.patch.hl') ||
              x.name.endsWith('.socket.hl')));
        }

        // Checking if we can create 'create slots' files.
        const canCreateSlotsAndSqlFiles = splits.length >= 4 &&
          splits[1] === 'modules' &&
          splits.filter(x => x === 'magic.startup').length !== 0;
        if (canCreateSlotsAndSqlFiles) {

          // Verifying we're NOT in 'db-migrations' folder.
          if (splits.filter(x => x === 'db-migrations').length === 0) {

            // Concatenating '/acme.foo.bar.hl' file.
            result = result.concat(this.templates.filter(x => x.name.endsWith('/acme.foo.bar.hl')));

            // Concatenating all .sql type of files.
            result = result.concat(this.templates.filter(x => x.name.endsWith('.mssql.sql') || x.name.endsWith('.mysql.sql')));

            // Concatenating 'create-database.hl' file.
            result = result.concat(this.templates.filter(x => x.name.endsWith('/create-database.hl')));
          }
        }

        // Checking if we can create MySQL migration scripts.
        if (canCreateSlotsAndSqlFiles && splits.filter(x => x === 'db-migrations' || x === 'mysql').length === 2) {
          result = result.concat(this.templates.filter(x => x.name.endsWith('0001-migrate-foo_bar-mysql-database.sql')))
        }

        // Checking if we can create MySQL migration scripts.
        if (canCreateSlotsAndSqlFiles && splits.filter(x => x === 'db-migrations' || x === 'pgsql').length === 2) {
          result = result.concat(this.templates.filter(x => x.name.endsWith('0001-migrate-foo_bar-mysql-database.sql')))
        }

        // Checking if we can create MS SQL migration scripts.
        if (canCreateSlotsAndSqlFiles && splits.filter(x => x === 'db-migrations' || x === 'mssql').length === 2) {
          result = result.concat(this.templates.filter(x => x.name.endsWith('0001-migrate-foo_bar-mssql-database.sql')))
        }

        // Returning result to caller.
        return result;
    }
  }

  /**
   * Invoked when selected template is changed.
   */
  public templateChanged() {

    // Invoking backend to retrieve file's content.
    this.fileService.loadFile(this.activeTemplate.name).subscribe((result: string) => {

      // Assigning model.
      this.data.template = result;
      this.data.name = this.activeTemplate.name.substr(this.activeTemplate.name.lastIndexOf('/') + 1);

      // For simplicity reasons we assign focus to file name input.
      this.fileName.nativeElement.focus();

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns true if the filename is valid, otherwise false.
   */
  public pathValid() {

    // Verifying user has typed a path at all.
    if (!this.data.name || this.data.name.length === 0) {
      return false;
    }

    // Verifying path doesn't contain invalid characters.
    for (const idx of this.data.name) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789_-.'.indexOf(idx.toLowerCase()) === -1) {
        return false;
      }
    }

    // Making sure no other file/folder already exists with the same name.
    if (this.data.isFolder) {

      // Verifying folder doesn't exist from before.
      return this.data.folders.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase() + '/').length === 0;

    } else {

      // Verifying file doesn't exist from before.
      return this.data.files.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase()).length === 0;

    }
  }
}
