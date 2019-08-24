
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private httpClient: HttpClient) { }

  public listFiles(path: string) {
    return this.httpClient.get<string[]>(
      environment.apiURL + 
      'folders/list-files?folder=' + encodeURI(path));
  }

  public listFolders(path: string) {
    return this.httpClient.get<string[]>(
      environment.apiURL + 
      'folders/list-folders?folder=' + encodeURI(path));
  }

  public getFileContent(path: string) {
    const requestOptions: Object = {
      responseType: 'text'
    };
    return this.httpClient.get<string>(
      environment.apiURL + 
      'files?file=' + encodeURI(path), 
      requestOptions);
  }
}
