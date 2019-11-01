
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  constructor(private httpClient: HttpClient) { }

  public evaluate(sql: string, databaseType = 'mysql') {
    return this.httpClient.post<any[]>(
      environment.apiURL +
      `magic/modules/${databaseType}/evaluate`, {
        sql,
      });
  }

  public getSavedFiles(databaseType = 'mysql') {
    return this.httpClient.get<string[]>(environment.apiURL + `magic/modules/${databaseType}/list-files`);
  }
}
