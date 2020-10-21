
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TicketService } from './ticket-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeysService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  getKeys(filter: string = null) {
    const like = !filter ||
      filter === '' ?
        '' :
        '?subject.like=' + encodeURIComponent('%' + filter + '%');
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/magic/crypto_keys');
  }

  importKey(
    subject: string,
    url: string,
    email: string,
    content: string,
    fingerprint: string) {
      return this.httpClient.post<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/magic/crypto_keys', {
          subject,
          url,
          email,
          content,
          fingerprint,
          type: 'RSA'
        });
  }

  editKey(
    id: number,
    subject: string,
    url: string,
    email: string) {
      return this.httpClient.put<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/magic/crypto_keys', {
          id,
          subject,
          url,
          email
        });
  }

  deleteKey(id: number) {
    return this.httpClient.delete<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/magic/crypto_keys?id=' +
      id);
  }

  getFingerprint(key: string) {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/crypto/get-fingerprint?key=' +
      encodeURIComponent(key));
  }
}
