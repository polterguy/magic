
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Endpoint } from '../models/endpoint';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private httpClient: HttpClient) { }

  getAllEndpoints() {
    return this.httpClient.get<Endpoint[]>(environment.apiURL + 'magic/modules/system/endpoints/endpoints');
  }

  generate(endpoints: any) {
    this.httpClient.post<any>(environment.apiURL + 'magic/modules/system/endpoints/generate', endpoints, {
        observe: 'response',
        responseType: 'arraybuffer',
      }).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.substr(disp.indexOf('=') + 1);
        filename = filename.substr(1, filename.length - 2);
        alert(filename);

        // Creating a BLOB URL.
        const blob = new Blob([res.body], { type: res.headers.get('Content-Type')});
        const url = window.URL.createObjectURL(blob);

        // To maintain the correct filename, we have to apply this little "hack".
        const fileLink = document.createElement('a');
        fileLink.href = url;
        fileLink.download = filename;
        fileLink.click();
      });
  }

  executeGet(url: string) {
    return this.httpClient.get<any>(environment.apiURL + url);
  }

  executeDelete(url: string) {
    return this.httpClient.delete<any>(environment.apiURL + url);
  }

  executePost(url: string, args: any) {
    return this.httpClient.post<any>(environment.apiURL + url, args);
  }

  executePut(url: string, args: any) {
    return this.httpClient.put<any>(environment.apiURL + url, args);
  }
}
