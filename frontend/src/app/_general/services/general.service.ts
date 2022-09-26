
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  /**
   * general loading definition
   */
  private _loading = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this._loading.asObservable();

  /**
   * observing the screen size to be used throughout the site
   */
  private largeScreen = new BehaviorSubject<boolean>(undefined!);

  constructor(private _snackBar: MatSnackBar) { }

  /**
   * to display general loading
   */
  showLoading() {
    this._loading.next(true);
  }
  /**
   * to hide general loading
   */
  hideLoading() {
    this._loading.next(false);
  }

  /**
   * shows feedback message in a snackbar
   * @param message message for showing feedback in the snackbar
   * @param panelClass optional; errorMessage, successMessage OR warningMessage,  ::: css class name
   * @param actionButton optional; if action needed, then specify the name of the action --- snackbar will be closed by clicking on the action button
   * @param duration optional; if available, the default value of 2000 ms will be overwritten
   */
  showFeedback(message: string, panelClass?: string, actionButton?: string, duration?: number) {
    if (message?.startsWith('Guru meditation')) {
      return;
    }
    this._snackBar.open(message, actionButton, {
      duration: duration || 2000, // if exists use it, otherwise use default
      panelClass: [panelClass!] // if available
    });
  }

  /**
   * 
   * @returns boolean value indicating the site is rendered on a small or large screen size device
   */
  getScreenSize(): Observable<boolean> {
    return this.largeScreen.asObservable();
  }
  /**
   * 
   * @param status boolean
   * set to true if the device in use is a large screen device
   */
  setScreenSize(status: boolean) {
    this.largeScreen.next(status);
  }
}
