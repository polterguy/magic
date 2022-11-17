
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/_general/services/http.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  /**
   *
   * @param httpService api services
   */
  constructor(private httpService: HttpService, private http: HttpClient) { }

  // register(data: User) {
  //   return this.httpService.post('magic/system/auth/register', data);
  // }

  // login(data: string) {
  //   return this.httpService.get('magic/system/auth/authenticate', data);
  // }

  // forgotPass(data: User) {
  //   return this.httpService.post('magic/system/auth/send-reset-password-link', data);
  // }

  // changePass(data: User, auth_token?: string) {
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${auth_token}`
  //   })

  //   return this.httpService.put('magic/system/auth/change-password', data, { headers: headers });
  // }

  // verifyEmail(data: Verification) {
  //   return this.httpService.post('magic/system/auth/verify-email', data);
  // }

  // verifyCode(data: any) {
  //   return this.httpService.post('magic/system/auth/verify-code', data);
  // }

  // /**
  //  * Verifies availability of username supplied during
  //  * registration by invoking backend.
  //  *
  //  * @param username Username of user which is supplied during registration
  //  */
  // usernameAvailability(username: string) {

  //   // Invokes backend and returns observable to caller.
  //   return this.httpService.get('magic/system/auth/username-taken?username=' + username);
  // }

  // /**
  //  * Verifies availability of email supplied during
  //  * registration by invoking backend.
  //  *
  //  * @param email email of user which is supplied during registration
  //  */
  // emailAvailability(email: string) {

  //   // Invokes backend and returns observable to caller.
  //   return this.httpService.get('magic/system/auth/email-taken?email=' + email);
  // }

  // /**
  //  * Calling endpoint to set the extra fields for the newly registered user.
  //  * @param data Username.
  //  */
  // addExtraField(data: any) {
  //   return this.httpService.post('magic/modules/hub/add-extra-fields', data);
  // }

  // resendConfirmationEmail(data: User) {
  //   return this.httpService.post('magic/system/auth/resend-confirm', data);
  // }

  // checkSubscription(data: string) {
  //   return this.http.get(environment.bazarUrl + 'subscribing' + data);
  // }

  // getDataCenters() {
  //   return this.httpService.get('magic/modules/hub/clusters');
  // }

  // updateExtraField(data: ExtraUserData) {
  //   return this.httpService.put('magic/system/auth/update-extra-info', data);
  // }

  // verifyPassword(password: string) {
  //   return this.httpService.get('magic/system/auth/verify-password?password=' + password);
  // }

  // refreshToken() {
  //   return this.httpService.get('magic/system/auth/refresh-ticket');
  // }
}
