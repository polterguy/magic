
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
      return this.data.folders.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase() + '/').length === 0;
    } else {
      return this.data.files.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase()).length === 0;
    }
  }
}
