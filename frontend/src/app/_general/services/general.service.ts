
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Gneral service with helpers for subscribing to screen size changes, showing loader, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  private largeScreen = new BehaviorSubject<boolean>(undefined!);
  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  constructor(private _snackBar: MatSnackBar) { }

  showLoading() {
    this._loading.next(true);
  }

  hideLoading() {
    this._loading.next(false);
  }

  showFeedback(message: string, panelClass?: string, actionButton?: string, duration?: number) {
    this._snackBar.open(message, actionButton, {
      duration: duration || 2000, // if exists use it, otherwise use default
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['top-aligned-snackbar', panelClass]
    });
  }

  getScreenSize(): Observable<boolean> {
    return this.largeScreen.asObservable();
  }

  setScreenSize(status: boolean) {
    this.largeScreen.next(status);
  }
}
