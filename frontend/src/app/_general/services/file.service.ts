
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { MagicResponse } from '../models/magic-response.model';
import { MacroDefinition } from '../../_protected/models/common/macro-definition.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { HttpService } from 'src/app/_general/services/http.service';
import { Observable } from 'rxjs';
import { CacheService } from 'src/app/_general/services/cache.service';

/**
 * File service allowing you to read, download, upload, and delete files.
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(
    private httpService: HttpService,
    private generalService: GeneralService,
    private cacheService: CacheService) { }

  /**
   * Returns a list of all files existing within the specified folder.
   */
  public listFiles(folder: string, filter: string = null) {

    let query = '?folder=' + encodeURIComponent(folder);
    if (filter) {
      query += '&filter=' + encodeURIComponent(filter);
    }
    return this.httpService.get<string[]>('/magic/system/file-system/list-files' + query);
  }

  /**
   * Returns a list of all files existing within the specified folder recursively.
   */
  public listFilesRecursively(folder: string, sysFiles: boolean) {

    let query = '?folder=' + encodeURIComponent(folder);
    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-files-recursively' +
      query +
      '&sys=' + sysFiles);
  }

  /**
   * Returns a list of all folders existing within the specified folder.
   */
  public listFolders(folder: string) {

    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-folders?folder=' +
      encodeURIComponent(folder));
  }

  /**
   * Returns a list of all folders existing within the specified folder recursively.
   */
  public listFoldersRecursively(folder: string, sysFiles: boolean) {

    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-folders-recursively?folder=' +
      encodeURIComponent(folder) +
      '&sys=' + sysFiles);
  }

  /**
   * Loads the specified file from backend.
   */
  public loadFile(filename: string) {

    const requestOptions = {
      responseType: 'text'
    };
    return this.httpService.get<string>(
      '/magic/system/file-system/file?file=' +
      encodeURIComponent(filename),
      requestOptions);
  }

  /**
   * Saves the specified file with the given filename.
   */
  public saveFile(filename: string, content: string) {

    const folder = filename.substring(0, filename.lastIndexOf('/') + 1);
    const formData: FormData = new FormData();
    const blob = new Blob([content], { type: 'text/plain' });
    formData.append('file', blob, filename.substring(filename.lastIndexOf('/') + 1));
    return this.httpService.put<any>('/magic/system/file-system/file?folder=' + encodeURIComponent(folder), formData);
  }

  /**
   * Renames the specified file or folder in the backend.
   */
  public rename(oldName: string, newName: string) {

    return this.httpService.post<MagicResponse>(
      '/magic/system/file-system/rename', {
      oldName,
      newName,
    });
  }

  /**
   * Deletes an existing file on the server.
   */
  public deleteFile(file: string) {

    return this.httpService.delete<MagicResponse>('/magic/system/file-system/file?file=' + encodeURIComponent(file));
  }

  /**
   * Downloads a file from backend.
   */
  public downloadFile(path: string) {

    this.httpService.download('/magic/system/file-system/file?file=' + encodeURIComponent(path)).subscribe({
      next: (res) => {

        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
        saveAs(file, filename);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
    });
  }

  /**
   * Uploads a file to your backend.
   */
  public uploadFile(path: string, file: any) {

    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>('/magic/system/file-system/file?folder=' + encodeURIComponent(path), formData);
  }

  /**
   * Uploads a database backup file.
   */
  public uploadDatabaseBackup(file: any) {

    return new Observable<any>(subscriber => {
      const formData: FormData = new FormData();
      formData.append('file', file);
      this.httpService.put<any>('/magic/system/sql/backup', formData).subscribe({
        next: (result: any) => {

          this.cacheService.delete('magic.sql.databases.sqlite.*').subscribe({
            next: () => {

              subscriber.next(result);
              subscriber.complete();
            },
            error: (error: any) => {

              subscriber.error(error);
              subscriber.complete();
            }
          });
        },
        error: (error: any) => {

          subscriber.error(error);
          subscriber.complete();
        }
      })
    });
  }

  /**
   * Imports users
   */
  public importUsers(file: any) {

    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>('/magic/system/auth/import-users', formData);
  }

  /**
   * Uploads a file to your backend.
   */
  public uploadStaticWebsite(data: FormData) {

    return this.httpService.put<any>('/magic/system/file-system/overwrite-folder', data);
  }

  /**
   * Downloads a file from backend.
   */
  public downloadFolder(path: string) {

    this.httpService.download('/magic/system/file-system/download-folder?folder=' + encodeURIComponent(path)).subscribe({
      next: (res) => {

        const disp = res.headers.get('Content-Disposition');
        let filename = disp.substring(disp.indexOf('=') + 1);
        filename = filename.substring(1, filename.lastIndexOf('"'));
        const file = new Blob([res.body], { type: 'application/zip' });
        saveAs(file, filename);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /**
   * Creates a new folder on the server.
   */
  public createFolder(folder: string) {

    return this.httpService.put<MagicResponse>('/magic/system/file-system/folder', { folder });
  }

  /**
   * Deletes an existing folder on the server.
   */
  public deleteFolder(folder: string) {

    return this.httpService.delete<MagicResponse>('/magic/system/file-system/folder?folder=' + encodeURIComponent(folder));
  }

  /**
   * Returns macro definition to caller for specified macro.
   */
  public getMacroDefinition(file: string) {

    return this.httpService.get<MacroDefinition>('/magic/system/ide/macro?macro=' + encodeURIComponent(file));
  }

  /**
   * Returns macro definition to caller for specified macro.
   */
  public executeMacro(file: string, args: any) {

    return this.httpService.post<MagicResponse>('/magic/system/ide/execute-macro', { macro: file, args });
  }

  /**
   * Uploads a zip file to your backend.
   */
  public installModule(file: File) {

    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>('/magic/system/file-system/install-module', formData);
  }

  /**
   * Unzips file in place.
   */
  public unzip(file: string) {

    return this.httpService.put<MagicResponse>('/magic/system/file-system/unzip', {
      file,
      create_folder: true,
    });
  }
}
