
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  // setUserData(user?: User) {
  //   user ? sessionStorage.setItem('user', JSON.stringify(user)) : sessionStorage.removeItem('user');
  // }

  // getUserData() {
  //   return JSON.parse(sessionStorage.getItem('user') || '{}');
  // }
}
