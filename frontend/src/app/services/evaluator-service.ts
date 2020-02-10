
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
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
}
