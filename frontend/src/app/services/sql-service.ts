
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  constructor(private httpClient: HttpClient) { }

  public evaluate(sql: string) {
    return this.httpClient.post<any[]>(
      environment.apiURL +
      'hl/mysql/evaluate', {
        sql,
      });
  }
}
