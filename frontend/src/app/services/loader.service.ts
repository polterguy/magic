
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

/**
 * Service that helps you determine if there is an ongoing HTTP request
 * towards your backend or not. Used to display "Ajax wait spinner".
 * 
 * Combined with the LoaderInterceptor, this is the service that makes
 * sure the user sees an animated Ajax loader during invocations towards the backend.
 */
@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  /**
   * If true, one or more Ajax requests are currently going towards your backend.
   */
  public isLoading = new BehaviorSubject<boolean>(false);

  /**
   * Shows the Ajax load spinner.
   */
  public show() {
    setTimeout(() => {
      this.isLoading.next(true);
    });
  }

  /**
   * Hides the Ajax load spinner.
   */
  public hide() {
    setTimeout(() => {
      this.isLoading.next(false);
    });
  }
}
