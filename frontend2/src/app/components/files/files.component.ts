
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { FileService } from 'src/app/services/file.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Files component to allow user to browse his dynamic files folder,
 * and edit and modify its content.
 */
@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent extends BaseComponent implements OnInit {

  /**
   * Displayed columns in data table.
   */
  public displayedColumns: string[] = [
    'path'
  ];

  /**
   * Current folder we're viewing contens of.
   */
  public currentFolder = '/';

  /**
   * Folders and files inside currently viewed folder.
   */
  public items: string[] = null;

  /**
   * Creates an instance of your component.
   * 
   * @param fileService File service used to retrieve files and folders from backend
   * @param messageService Used to send and retrieve messages from other components.
   */
  constructor(
    private fileService: FileService,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving files from backend to initially display to user.
    this.getFolderContent();
  }

  /**
   * Returns filename or folder name of specified path.
   * 
   * @param path Path to return object name for
   */
  public getObjectName(path: string) {
    const elements = path.split('/').filter(x => x !== '');
    return elements[elements.length - 1];
  }

  /*
   * Private helper methods
   */

  /*
   * Retrieves the content of the currently viewed folder, and databinds UI.
   */
  private getFolderContent() {

    // Retrieving files and folders from backend.
    const foldersObservable = this.fileService.listFolders(this.currentFolder);
    const filesObservable = this.fileService.listFiles(this.currentFolder);
    forkJoin([foldersObservable, filesObservable]).subscribe((res: string[][]) => {

      // Assigning return values of above observers to related fields.
      this.items = (res[0] || []).concat(res[1] || []);

    }, (error: any) => this.showError(error));
  }
}
