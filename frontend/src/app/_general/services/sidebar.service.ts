
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeneralService } from './general.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  private _sidebarChanged!: BehaviorSubject<boolean>;

  /**
   * defining the navbar's status: true if navbar is expanded
   */
  private _expanded!: boolean;

  /**
   * to allow users to subscribe to sidebar changes
   */
  expandedChanged!: Observable<boolean>;

  /**
   * to define the screensize
   */
  private isLarge!: boolean;

  /**
   * Creates an instance of your type.
   * @params generalService To get changes on screen size
   */
  constructor(private generalService: GeneralService) {
    this.generalService.getScreenSize().subscribe((status: boolean) => {
      this.isLarge = status;
      this._expanded = this.isLarge === false ? false : localStorage.getItem('sidebar') !== 'close';
      this._sidebarChanged = new BehaviorSubject<boolean>(this._expanded);
      this.expandedChanged = this._sidebarChanged.asObservable();
      return this.expanded;
    })
  }

  /**
   * returns boolean value based on the navbar's status: true if navbar is expanded
   */
  get expanded() {
    return this._expanded;
  }

  /**
   * changes whether or not navbar is expanded
   */
  set expanded(value: boolean) {
    this._expanded = value;
    // change and store sidebar value in localstorage only if the screen size is large
    this.isLarge ? localStorage.setItem('sidebar', value ? 'open' : 'close') : '';
    this._sidebarChanged.next(value);
  }

  /**
   * toggles sidebar from other components
   */
  public toggle() {
    this.expanded = !this.expanded;
  }
}
