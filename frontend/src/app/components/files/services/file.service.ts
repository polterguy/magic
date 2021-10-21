
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { Response } from '../../../models/response.model';
import { HttpService } from '../../../services/http.service';
import { MacroDefinition } from './models/macro-definition.model';

/**
 * File service allowing you to read, download, upload and delete files.
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
   * @param filter Filter for which files to return
   */
  public listFiles(folder: string, filter: string = null) {

    // Dynamically building our query.
    let query = '?folder=' + encodeURIComponent(folder);
    if (filter) {
      query += '&filter=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/modules/system/file-system/list-files' +
      query);
  }

  /**
   * Returns a list of all files existing within the specified folder recursively.
   * 
   * @param folder Folder from where to retrieve list of files from
   */
   public listFilesRecursively(folder: string) {

    // Dynamically building our query.
    let query = '?folder=' + encodeURIComponent(folder);

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/modules/system/file-system/list-files-recursively' +
      query);
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
   * Returns a list of all folders existing within the specified folder recursively.
   * 
   * @param folder Folder from where to retrieve list of folders from
   */
   public listFoldersRecursively(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/modules/system/file-system/list-folders-recursively?folder=' +
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
      '/magic/modules/system/file-system/file?file=' +
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
      '/magic/modules/system/file-system/file?folder=' +
      encodeURI(folder),
      formData
    );
  }

  /**
   * Renames the specified file or folder in the backend.
   * 
   * @param oldName File or folder to rename.
   * @param newName New name for file or folder.
   */
   public rename(oldName: string, newName: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>(
      '/magic/modules/system/file-system/rename', {
        oldName,
        newName,
      });
  }

  /**
   * Deletes an existing file on the server.
   * 
   * @param file Path of file to delete
   */
  public deleteFile(file: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/file-system/file?file=' +
      encodeURIComponent(file));
  }

  /**
   * Downloads a file from backend.
   * 
   * @param path File to download
   */
   public downloadFile(path: string) {

    // Invoking backend to download file and opening up save-as dialog.
    this.httpService.download(
      '/magic/modules/system/file-system/file?file=' +
      encodeURI(path)).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
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
      '/magic/modules/system/file-system/file?folder=' +
      encodeURI(path),
      formData
    );
  }

  /**
   * Unzips an existing file on the server in its current folder.
   * 
   * @param file Path of file to unzip
   */
  public unzipFile(file: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.put<Response>('/magic/modules/system/file-system/unzip', {
      file
    });
  }

  /**
   * Returns whether or not the application can be successfully installed or not.
   * 
   * @param required_magic_version Minimum Magic version required by app to function correctly
   */
  public canInstall(required_magic_version: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Response>(
      '/magic/modules/system/bazar/can-install?required_magic_version=' +
      encodeURIComponent(required_magic_version));
  }

  /**
   * (Re) installs a module
   * 
   * @param folder Path of folder to re-install
   */
  public install(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.put<Response>('/magic/modules/system/file-system/install', {
      folder
    });
  }

  /**
   * Downloads a file to your backend from an external URL.
   * 
   * @param folder Folder on server where user wants to save the file
   * @param url URL to file user wants to download to his local server
   */
   public downloadFileToBackend(folder: string, url: string) {

    // Invoking backend to download file to server.
    return this.httpService.post<Response>('/magic/modules/system/bazar/download-from-url', {
      folder,
      url,
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
        const file = new Blob([res.body], { type: 'application/zip' });
        saveAs(file, filename);
      });
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

  /**
   * Returns macro definition to caller for specified macro.
   * 
   * @param file Full path of macro to retrieve meta information about
   */
  public getMacroDefinition(file: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<MacroDefinition>('/magic/modules/system/ide/macro?macro=' +
      encodeURIComponent(file));
  }

  /**
   * Returns macro definition to caller for specified macro.
   * 
   * @param file Full path of macro to retrieve meta information about
   * @param args Arguments to macro execution
   */
   public executeMacro(file: string, args: any) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/ide/execute-macro', {
      macro: file,
      args
    });
  }
}
