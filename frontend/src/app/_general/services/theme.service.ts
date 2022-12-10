
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import themes from './themes.json';

/**
 * Service that keeps track of what theme we're currently using.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private _themeChanged: BehaviorSubject<string>;

  /**
   * To allow consumers to subscribe to theme change events.
   */
  themeChanged: Observable<string>;

  /**
   * Creates an instance of your type.
   */
  constructor() {
    const theme = localStorage.getItem('theme') || 'default';
    this._themeChanged = new BehaviorSubject<string>(theme);
    this.themeChanged = this._themeChanged.asObservable();
    if (theme && themes[theme]?.css_file) {
      this.injectTheme(theme);
    }
  }

  /**
   * Returns theme to caller.
   */
  get theme() {
    return localStorage.getItem('theme') || 'default';
  }

  /**
   * Sets theme to specified value and persists into localStorage.
   */
  set theme(value: string) {

    // Disabling old theme, if existing.
    const curTheme = localStorage.getItem('theme');
    if (curTheme) {
      this.disableTheme(curTheme);
      localStorage.removeItem('theme');
    }

    // Applying new theme.
    localStorage.setItem('theme', value);
    if (value && themes[value]?.css_file) {
      this.injectTheme(value);
    }
    this._themeChanged.next(value);
  }

  /**
   * Returns options for currently selected theme.
   */
  get theme_options() {
    return themes[this.theme];
  }

  /*
   * Private helper methods
   */

  /*
   * Injects a CSS file dynamically into the HTML head section
   */
  private injectTheme(theme: string) {
    if (!document.getElementById(theme)) {
      var head = document.getElementsByTagName('head')[0];
      var link = document.createElement('link');
      link.id = theme;
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = themes[theme].css_file;
      link.media = 'all';
      head.appendChild(link);
    } else {
      (<any>document.getElementById(theme)).disabled = false; // Simply enabling the element
    }
  }

  /*
   * Disables the specified CSS element
   */
  private disableTheme(theme: string) {
    const el = <any>document.getElementById(theme);
    if (el) {
      el.disabled = true;
    }
  }
}
