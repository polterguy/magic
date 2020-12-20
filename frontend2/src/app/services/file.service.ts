
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Response } from '../models/response.model';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of all files existing within the specified folder.
   * 
   * @param folder Folder from where to retrieve list of files from
   */
  public listFiles(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/modules/system/file-system/list-files?folder=' +
      encodeURIComponent(folder));
  }

  /**
   * Returns a list of all folders existing within the specified folder.
   * 
   * @param folder Folder from where to retrieve list of folders from
   */
  public listFolders(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/modules/system/file-system/list-folders?folder=' +
      encodeURIComponent(folder));
  }

  /**
   * Loads the specified file from backend.
   * 
   * @param filename Filename and full path of file to load.
   */
  public loadFile(filename: string) {

    // Making sure we copmmunicate that we want to have text result.
    const requestOptions = {
      responseType: 'text'
    };

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string>(
      '/api/files?file=' +
      encodeURIComponent(filename),
      requestOptions);
  }

  /**
   * Saves the specified file with the given filename.
   * 
   * @param filename Filename to save file as
   * @param content Content of file
   */
  public saveFile(filename: string, content: string) {

    // Passing in file as form data.
    const folder = filename.substr(0, filename.lastIndexOf('/') + 1);
    const formData: FormData = new FormData();
    const blob = new Blob([content], { type: 'text/plain'});
    formData.append('file', blob, filename.substr(filename.lastIndexOf('/') + 1));

    return this.httpService.put<any>(
      '/api/files?folder=' + encodeURI(folder),
      formData
    );
  }

  /**
   * Creates a new folder on the server.
   * 
   * @param folder Path for new folder
   */
  public createFolder(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.put<Response>(
      '/magic/modules/system/file-system/folder', {
        folder
    });
  }
}
