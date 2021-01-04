
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Status } from '../models/status.model';
import { KeyPair } from '../models/key-pair.model';
import { BackendService } from './backend.service';
import { Response } from '../models/response.model';
import { AuthenticateResponse } from '../models/authenticate-response.model';

/**
 * Cache service allowing the user to modify his or her cache, viewing items, removing
 * items, and purging cache altogether.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns the status of the backend.
   */
  public list() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/config/list-cache');
  }
}
