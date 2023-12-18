
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from 'src/app/services/http.service';

/**
 * Crypto service, allowing you to administrate your cryptography keys.
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Retrieves JWT token and returns to caller.
   */
  generateToken(username: string, role: string, expires: string) {
    const param: string = `?username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}&expires=${encodeURIComponent(expires)}`
    return this.httpService.get<any>('/magic/system/auth/generate-token' + param);
  }
}
