
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

  getAllKeys() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/magic/crypto_keys?limit=-1');
  }

  importKey(
    subject: string,
    domain: string,
    email: string,
    content: string,
    vocabulary: string,
    fingerprint: string,
    enabled: boolean) {
      return this.httpClient.post<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/magic/crypto_keys', {
          subject,
          domain,
          email,
          content,
          vocabulary,
          fingerprint,
          type: 'RSA',
          enabled,
        });
  }

  editKey(
    id: number,
    subject: string,
    domain: string,
    email: string,
    content: string,
    fingerprint: string,
    vocabulary: string,
    enabled: boolean) {
      return this.httpClient.put<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/magic/crypto_keys', {
          id,
          subject,
          domain,
          email,
          content,
          fingerprint,
          vocabulary,
          enabled,
        });
  }

  evictCache(id: string) {
    return this.httpClient.delete<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/misc/cache-evict?id=' +
      encodeURIComponent(id));
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
