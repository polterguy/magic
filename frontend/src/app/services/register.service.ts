
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Response } from 'src/app/models/response.model';

/**
 * Registration service allowing users to register in current backend.
 */
@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService Dependency injected HTTP service to handle HTTP requests
   */
  constructor(private httpService: HttpService) { }

  /**
   * Registers a new user in the backend.
   * 
   * @param data containing the following fields:
   * username User's email address,
   * password Password user selected,
   * frontendUrl Frontend's URL to use as root URL for confirming email address,
   * recaptcha_token is optional, exists only if recaptcha key is available
   */
  register(data: any) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>('/magic/system/auth/register', data);
  }

  /**
   * Verifies validity of email address supplied during
   * registration by invoking backend.
   * 
   * @param username Username of user which is email address user supplied during registration
   * @param token Security token system generated for user to avoid user's registering other users' email addresses
   */
  verifyEmail(username: string, token: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>('/magic/system/auth/verify-email', {
      username,
      token,
    });
  }

  /**
   * Verifies availability of username supplied during
   * registration by invoking backend.
   * 
   * @param username Username of user which is supplied during registration
   */
   usernameAvailability(username: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.get<Response>('/magic/system/auth/username-taken?username=' + username);
  }

  /**
   * Verifies availability of email supplied during
   * registration by invoking backend.
   * 
   * @param email email of user which is supplied during registration
   */
   emailAvailability(email: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.get<Response>('/magic/system/auth/email-taken?email=' + email);
  }
}
