
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
   * @param router Needed to be able to navigate to config if required
   * @param backendService 
   */
  constructor(
    private router: Router,
    private backendService: BackendService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    /**
     * Checking access rights per route
     */
    (async () => {
      while (!this.backendService.active.access.fetched)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (!route.data.check(this.backendService.active.access)) {
        this.router.navigate(['/']);
        return false;
      }
      return true;
    })();
    return true;
  }
}
