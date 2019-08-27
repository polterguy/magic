
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

  public deleteFile(path: string) {
    return this.httpClient.delete<string>(
      environment.apiURL + 'files?file=' + encodeURI(path)
    );
  }

  public saveFile(path: string, content: string) {
    const folder = path.substr(0, path.lastIndexOf('/') + 1);
    const formData: FormData = new FormData();
    const blob = new Blob([content], { type: "text/plain"});
    formData.append('file', blob, path.substr(path.lastIndexOf('/') + 1));
    return this.httpClient.post<any>(
      environment.apiURL + 
      'files?folder=' + encodeURI(folder),
      formData
    );
  }

  public createFolder(path: string) {
    return this.httpClient.put<void>(
      environment.apiURL + 'folders', {
        folder: path
      }
    );
  }

  public folderExists(path: string) {
    return this.httpClient.get<boolean>(
      environment.apiURL + 
      'folders/exists?path=' + encodeURI(path));
  }
}
