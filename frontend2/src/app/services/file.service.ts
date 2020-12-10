
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';

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
   * Loads the specified file from backend.
   * 
   * @param filename Filename and full path of file to load.
   */
  public loadFile(filename: string) {

    // Invoking backend and returning observable to caller.
    const requestOptions = {
      responseType: 'text'
    };
    return this.httpService.get<string>(
      '/api/files?file=' +
      encodeURIComponent(filename),
      requestOptions);
  }
}
