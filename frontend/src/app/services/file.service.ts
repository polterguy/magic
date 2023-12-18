
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { MagicResponse } from '../models/magic-response.model';
import { GeneralService } from 'src/app/services/general.service';
import { HttpService } from 'src/app/services/http.service';
import { Observable } from 'rxjs';
import { CacheService } from 'src/app/services/cache.service';

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
  listFiles(folder: string, filter: string = null) {

    let query = '?folder=' + encodeURIComponent(folder);
    if (filter) {
      query += '&filter=' + encodeURIComponent(filter);
    }
    return this.httpService.get<string[]>('/magic/system/file-system/list-files' + query);
  }

  /**
   * Returns a list of all files existing within the specified folder recursively.
   */
  listFilesRecursively(folder: string, sysFiles: boolean) {

    let query = '?folder=' + encodeURIComponent(folder);
    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-files-recursively' +
      query +
      '&sys=' + sysFiles);
  }

  /**
   * Returns a list of all folders existing within the specified folder.
   */
  listFolders(folder: string) {

    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-folders?folder=' +
      encodeURIComponent(folder));
  }

  /**
   * Returns a list of all folders existing within the specified folder recursively.
   */
  listFoldersRecursively(folder: string, sysFiles: boolean) {

    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-folders-recursively?folder=' +
      encodeURIComponent(folder) +
      '&sys=' + sysFiles);
  }

  /**
   * Loads the specified file from backend.
   */
  loadFile(filename: string) {

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
  saveFile(filename: string, content: string) {

    const folder = filename.substring(0, filename.lastIndexOf('/') + 1);
    const formData: FormData = new FormData();
    const blob = new Blob([content], { type: 'text/plain' });
    formData.append('file', blob, filename.substring(filename.lastIndexOf('/') + 1));
    return this.httpService.put<any>('/magic/system/file-system/file?folder=' + encodeURIComponent(folder), formData);
  }

  /**
   * Renames the specified file or folder in the backend.
   */
  rename(oldName: string, newName: string) {

    return this.httpService.post<MagicResponse>(
      '/magic/system/file-system/rename', {
      oldName,
      newName,
    });
  }

  /**
   * Deletes an existing file on the server.
   */
  deleteFile(file: string) {

    return this.httpService.delete<MagicResponse>('/magic/system/file-system/file?file=' + encodeURIComponent(file));
  }

  /**
   * Downloads a file from backend.
   */
  downloadFile(path: string) {

    this.generalService.showLoading();
    this.httpService.download(
      '/magic/system/file-system/file?file=' +
      encodeURIComponent(path)).subscribe({

      next: (res) => {

        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
        saveAs(file, filename);
        this.generalService.hideLoading();
      },

      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
    });
  }

  /**
   * Uploads a file to your backend.
   */
  uploadFile(path: string, file: any) {

    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>('/magic/system/file-system/file?folder=' + encodeURIComponent(path), formData);
  }

  /**
   * Uploads a database backup file.
   */
  uploadDatabaseBackup(file: any) {

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
   * Downloads a file from backend.
   */
  downloadFolder(path: string) {

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
  createFolder(folder: string) {

    return this.httpService.put<MagicResponse>('/magic/system/file-system/folder', { folder });
  }

  /**
   * Deletes an existing folder on the server.
   */
  deleteFolder(folder: string) {

    return this.httpService.delete<MagicResponse>('/magic/system/file-system/folder?folder=' + encodeURIComponent(folder));
  }

  /**
   * Uploads a zip file to your backend.
   */
  installModule(file: File) {

    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>('/magic/system/file-system/install-module', formData);
  }

  /**
   * Unzips file in place.
   */
  unzip(file: string) {

    return this.httpService.put<MagicResponse>('/magic/system/file-system/unzip', {
      file,
      create_folder: true,
    });
  }
}
