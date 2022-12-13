
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Endpoint } from 'src/app/_general/models/endpoint.model';
import { EndpointService } from 'src/app/_general/services/endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class EndpointsGeneralService {

  /**
   * storing the whole list in an observable to be accessible throughout the project
   */
  private _endpoints = new BehaviorSubject<Endpoint[] | null>(null);
  public endpoints = this._endpoints.asObservable();

  constructor(private endpointService: EndpointService) { }

  /**
   * Fetching the list of sectors and industries by calling the API.
   * It will be invoked only once and data will be stored in variables,
   * unless requested otherwise.
   */
  public getEndpoints() {
    this.endpointService.endpoints().subscribe({
      next: (res: Endpoint[]) => {
        this._endpoints.next(res || []);
      },
      error: () => { },
    })
  }
}
