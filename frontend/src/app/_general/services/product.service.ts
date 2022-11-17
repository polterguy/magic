
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // /**
  //  * storing the list of plans in an observable to be accessible throughout the project
  //  */
  //  private _planSubject = new BehaviorSubject<Plans[] | null>(null);

  //  /**
  //  * reading the list of plans publicly
  //  */
  //  public planList = this._planSubject.asObservable();

  //  /**
  //  * storing the existing cloudlets
  //  */
  //   private _cloudletSubject = new BehaviorSubject<Cloudlets[] | null>(null);

  //   /**
  //    * reading the existing cloudlets value publicly
  //    */
  //   public cloudletList = this._cloudletSubject.asObservable();

  constructor(
    public userService: UserService,
    private recaptchaV3Service: ReCaptchaV3Service) { }

  /**
   * Fetching the list of plans and cloudlets if it's a human requesting!
   * Cloudlets will be fetched only if the user has confirmed his email.
   * @param onlyCloudlet To specify if the request is to update the list of exisiting cloudlets only.
   */
  //  public getProducts(onlyCloudlet?: boolean) {
  //   this.recaptchaV3Service.execute('regFormSubmission').subscribe({
  //     next: (token: any) => {
  //       if (this.userService.getUserData().role !== 'unconfirmed') {
  //         this.getCloudlets(token);
  //       }
  //       if (onlyCloudlet !== true) {
  //         this.getPlans(token);
  //       }
  //     },
  //     error: (e: any) => { }
  //   });
  // }

  // private getPlans(token: any) {
  //   this.apiService.getPlans(token).subscribe({
  //     next: (res: Plans[]) => {
  //       if (res) {
  //         this._planSubject.next(res);
  //       } else {
  //         this._planSubject.next([]);
  //       }
  //     },
  //     error: (e) => { return e; }
  //   })
  // }

  // private getCloudlets(token: any) {
  //   this.apiService.getCloudlets(token).subscribe({
  //     next: (res: Cloudlets[]) => {
  //       if (res) {
  //         this._cloudletSubject.next(res || []);
  //       } else {
  //         this._cloudletSubject.next([]);
  //       }
  //     },
  //     error: (e: any) => {
  //       return e;
  //     }
  //   });
  // }
}
