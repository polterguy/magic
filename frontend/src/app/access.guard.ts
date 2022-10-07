
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

// Application specific imports.
import { BackendService } from './services/backend.service';

/**
 * Access guard verifying router link can be activated.
 */
@Injectable({
  providedIn: 'root'
})
export class AccessGuard implements CanActivate {

  hasAccess: boolean = undefined;

  /**
   * Creates an instance of your type.
   *
   * @param router Needed to redirect if user doesn't have access
   * @param backendService Needed to determine access rights of user
   */
  constructor(
    private router: Router,
    private backendService: BackendService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      (async () => {
        while (this.backendService.active.access && !Object.keys(this.backendService.active.access.auth).length)
          await new Promise(resolve => setTimeout(resolve, 100));
          if (this.backendService.active.access) {
            const notAuthorized: boolean = Object.values(this.backendService.active.access.auth).every((item: any) => {return item === false})

          notAuthorized && !this.backendService.active.token?
          this.router.navigate(['/authentication']) : '';
        }
      })();
      return true;
  }

}
