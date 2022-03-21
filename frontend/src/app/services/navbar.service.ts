
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Keeps track of whether or not navbar is expanded.
 */
@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  private _navbarChanged: BehaviorSubject<boolean>;

  // If true sidebar is expanded, otherwise sidebar is not expanded.
  private _expanded: boolean;

  /**
   * To allow consumers to subscribe to navbar changes.
   */
   expandedChanged: Observable<boolean>;

  /**
   * Creates an instance of your type.
   */
  constructor() {
    this._expanded = localStorage.getItem('sidebar') !== 'close';
    this._navbarChanged = new BehaviorSubject<boolean>(this._expanded);
    this.expandedChanged = this._navbarChanged.asObservable();
  }

  /**
   * Returns true if navbar is expanded.
   */
  get expanded() {
    return this._expanded;
  }

  /**
   * Changes whether or not navbar is expanded or not.
   */
  set expanded(value: boolean) {
    this._expanded = value;
    localStorage.setItem('sidebar', value ? 'open' : 'close');
    this._navbarChanged.next(value);
  }

  /**
   * Toggles navbar.
   */
  toggle() {
    this.expanded = !this.expanded;
  }
}
