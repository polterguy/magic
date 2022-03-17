
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Response } from 'src/app/models/response.model';

/**
 * Authentication and authorization HTTP service.
 * 
 * This service will allow you to authenticate towards the active backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService Dependency injected HTTP service to handle HTTP requests
   */
  constructor(private httpService: HttpService) { }

  /**
   * Changes currently logged in user's password.
   * 
   * @param password New password for user
   */
  changePassword(password: string) {

    // Invoking backend returning observable to caller.
    return this.httpService.put<Response>('/magic/system/auth/change-password', {
      password
    });
  }

  /**
   * Registers a new user in the backend.
   * 
   * @param username User's email address
   * @param password Password user selected
   * @param frontendUrl Frontend's URL to use as root URL for confirming email address
   */
  register(username: string, password: string, frontendUrl: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>(
      '/magic/system/auth/register', {
        username,
        password,
        frontendUrl,
      });
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
    return this.httpService.post<Response>(
      '/magic/system/auth/verify-email', {
        username,
        token,
      });
  }

  /**
   * Invokes the backend to have a reset password email being sent to user.
   * 
   * @param username Username of user to generate the email for
   * @param frontendUrl URL of frontend to use to build reset-password email from
   */
  sendResetPasswordEmail(username: string, frontendUrl: string) {

    // Invoking backend returning observable to caller.
    return this.httpService.post<Response>('/magic/system/auth/send-reset-password-link', {
      username,
      frontendUrl,
    });
  }
}
