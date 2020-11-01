
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  evaluate(hyperlambda: string) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/misc/evaluate', {
        hyperlambda
    });
  }

  vocabulary() {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/misc/vocabulary');
  }

  documentation(module: string) {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/misc/documentation?module=' +
      encodeURIComponent(module)
    );
  }

  invocations(filter: any) {
    let query = '?order=created&direction=desc';
    if (filter.offset !== 0) {
      query += '&offset=' + filter.offset;
      if (filter.crypto_key) {
        query += '&crypto_key.eq=' + filter.crypto_key;
      }
    } else {
      if (filter.crypto_key) {
        query += '&crypto_key.eq=' + filter.crypto_key;
      }
    }
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/magic/crypto_invocations' +
      query);
  }

  countInvocations(filter: any) {
    let query = '';
    if (filter.crypto_key) {
      query += '?crypto_key.eq=' + filter.crypto_key;
    }
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/magic/crypto_invocations-count' +
      query);
  }
}
