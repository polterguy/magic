
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
    'icon',
    'path',
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
  public getItemName(path: string) {
    const elements = path.split('/').filter(x => x !== '');
    return elements[elements.length - 1];
  }

  /**
   * Returns true if given path is a folder
   * 
   * @param path What path to check
   */
  public isFolder(path: string) {
    return path.endsWith('/');
  }

  /**
   * Invoked when a path item, such as a file or folder is clicked.
   * 
   * @param path Item that was clicked
   */
  public itemClicked(path: string) {

    // Checking what type of item that was clicked.
    if (this.isFolder(path)) {

      // Open the specified folder.
      this.currentFolder = path;
      this.getFolderContent();

    } else {

      // Open the specified file.
      this.editItem(path);
    }
  }

  /**
   * Invoked when user wants to go up one level from his current folder.
   */
  public up() {

    // Fiding all folders we're inside of.
    const elements = this.currentFolder.split('/').filter(x => x !== '');

    // Removing last folder, and prepending '/'.
    let newFolder = '/' + elements.slice(0, elements.length - 1).join('/');

    // Checking if this is not root folder, at which point we append another '/' at the end.
    if (newFolder !== '/') {
      newFolder += '/';
    }

    // Updating current folder, and re-retrieving items for folder.
    this.currentFolder = newFolder;
    this.getFolderContent();
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

  /*
   * Invoked when user wants to edit an item
   */
  private editItem(path: string) {
    console.log(path);
  }
}
