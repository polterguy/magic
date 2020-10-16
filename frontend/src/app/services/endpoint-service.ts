
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Endpoint } from '../models/endpoint';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  getAllEndpoints() {
    return this.httpClient.get<Endpoint[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/endpoints/endpoints');
  }

  generate(endpoints: any) {
    return this.httpClient.post<ArrayBuffer>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/endpoints/generate',
      endpoints, {
        observe: 'response',
        responseType: 'blob' as 'json',
      });
  }

  getAllTemplates() {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/endpoints/templates');
  }

  getTemplateMarkdown(name: string) {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/endpoints/template?name=' + encodeURIComponent(name));
  }

  executeGet(url: string) {
    return this.httpClient.get<any>(this.ticketService.getBackendUrl() + url);
  }

  executeDelete(url: string) {
    return this.httpClient.delete<any>(this.ticketService.getBackendUrl() + url);
  }

  executePost(url: string, args: any) {
    return this.httpClient.post<any>(this.ticketService.getBackendUrl() + url, args);
  }

  executePut(url: string, args: any) {
    return this.httpClient.put<any>(this.ticketService.getBackendUrl() + url, args);
  }

  executePatch(url: string, args: any) {
    return this.httpClient.patch<any>(this.ticketService.getBackendUrl() + url, args);
  }
}
