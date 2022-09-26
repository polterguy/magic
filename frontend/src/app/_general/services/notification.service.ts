
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GneralNotificationService {

  /**
   * storing the list of plans in an observable to be accessible throughout the project
   */
  // public _notifications = new BehaviorSubject<[] | null>(null);

  // /**
  // * reading the list of plans publicly
  // */
  // public notificationList = this._notifications.asObservable();

  // constructor(
  //   private notificationService: NotificationService) { }

  // public getNotifications() {
  //   const params = `?limit=10&offset=0&notifications.handled.eq=false`;
  //   this.notificationService.getNotifications(params).subscribe({
  //     next: (res: any) => {
  //       this._notifications.next(res || []);
  //     },
  //     error: (error: any) => { return error; }
  //   })
  // }
}
