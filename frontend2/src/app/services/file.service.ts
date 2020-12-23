
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

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
   * Deletes an existing file on the server.
   * 
   * @param file Path of file to delete
   */
  public deleteFile(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/file-system/file?file=' +
      encodeURIComponent(folder));
  }

  /**
   * Downloads a file from backend.
   * 
   * @param path File to download
   */
  public downloadFile(path: string) {

    // Invoking backend to download file and opening up save-as dialog.
    this.httpService.download(
      '/api/files?file=' +
      encodeURI(path)).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');;
        const file = new Blob([res.body]);
        saveAs(file, filename);
      });
  }

  /**
   * Downloads a file from backend.
   * 
   * @param path File to download
   */
  public downloadFolder(path: string) {

    // Invoking backend to download file and opening up save-as dialog.
    this.httpService.download(
      '/magic/modules/system/file-system/download-folder?folder=' +
      encodeURI(path)).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.substr(disp.indexOf('=') + 1);
        filename = filename.substr(1, filename.lastIndexOf('"') - 1);
        console.log(filename);
        const file = new Blob([res.body], { type: 'application/zip' });
        saveAs(file, filename);
      });
  }

  /**
   * Uploads a file to your backend.
   * 
   * @param path Folder to upload file to
   * @param file File you want to upload
   */
  public uploadFile(path: string, file: any) {

    // Invoking backend with a form data object containing file.
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>(
      '/api/files?folder=' + encodeURI(path),
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

  /**
   * Deletes an existing folder on the server.
   * 
   * @param folder Path of folder to delete
   */
  public deleteFolder(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/file-system/folder?folder=' +
      encodeURIComponent(folder));
  }
}
