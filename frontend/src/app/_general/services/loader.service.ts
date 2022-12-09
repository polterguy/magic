
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

/**
 * Loader service that helps you determine if there is currently a request loading datafrom the backend.
 */
@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  /**
   * If true, one or more Ajax requests are currently going towards your backend.
   */
  private _isLoading = new BehaviorSubject<boolean>(false);

  /**
   * Shows the Ajax load spinner.
   */
  show() {
    setTimeout(() => {
      this._isLoading.next(true);
    });
  }

  /**
   * Hides the Ajax load spinner.
   */
  hide() {
    setTimeout(() => {
      this._isLoading.next(false);
    });
  }

  /**
   * Returns true if we're currently loading data from backend.
   */
  get isLoading() {
    return this._isLoading;
  }
}
