
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

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
   * Current folder we're viewing contens of.
   */
  public currentFolder = '/';

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
   * Retrieves the content of the currently viewed folder, and databinds UI.
   */
  public getFolderContent() {

    // Retrieving files and folders from backend.
    const filesObservable = this.fileService.listFiles(this.currentFolder);
    const foldersObservable = this.fileService.listFolders(this.currentFolder);
    forkJoin([filesObservable, foldersObservable]).subscribe((res: string[][]) => {

      const files = res[0];
      const folders = res[1];
      console.log(res);
    }, (error: any) => this.showError(error));
  }
}
