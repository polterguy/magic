
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OverlayContainer } from '@angular/cdk/overlay';

/**
 * Service that keeps track of what theme we're currently using.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private _themeChanged: BehaviorSubject<string>;

  // Name of theme currently used, either 'light' or 'dark'.
  private _theme: string;

  /**
   * To allow consumers to subscribe to theme change events.
   */
   themeChanged: Observable<string>;

  /**
   * Creates an instance of your type.
   */
  constructor(private overlayContainer: OverlayContainer) {
    this._theme = localStorage.getItem('theme') || 'light';
    this.overlayContainer.getContainerElement().classList.add(this._theme);
    this._themeChanged = new BehaviorSubject<string>(this._theme);
    this.themeChanged = this._themeChanged.asObservable();
  }

  /**
   * Returns theme to caller.
   */
  get theme() {
    return this._theme;
  }

  /**
   * Sets theme to specified value and persists into localStorage.
   */
  set theme(value: string) {
    switch (value) {

      case 'light':
      case 'dark':
        localStorage.setItem('theme', value);
        this.overlayContainer.getContainerElement().classList.remove(this._theme);
        this._theme = value;
        this.overlayContainer.getContainerElement().classList.add(this._theme);
        this._themeChanged.next(value);
        break;

      default:
        throw `Theme '${value}' does not exist`;
      }
  }

  /**
   * Toggles current theme.
   */
  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }
}
