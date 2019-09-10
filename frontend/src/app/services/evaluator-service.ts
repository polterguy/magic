
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  constructor(private httpClient: HttpClient) { }

  evaluate(hyperlambda: string) {
    return this.httpClient.post<any>(environment.apiURL + 'hl/system/misc/evaluate', {
      hyperlambda
    });
  }

  vocabulary() {
    return this.httpClient.get<string[]>(environment.apiURL + 'hl/system/misc/vocabulary');
  }
}
