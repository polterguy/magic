
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ConfigService } from './services/management/config.service';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

/**
 * Access guard verifying router link can be activated.
 */
@Injectable({
  providedIn: 'root'
})
export class AccessGuard implements CanActivate {
  hasAccess;
  constructor(private router: Router, private configService: ConfigService, private authService: AuthService) {

  }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // if authenticated, then
    // check the configuration of database
    // and set access accordingly
    (async () => {
      while (!this.authService.authenticated)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.authService.authenticated) {
        while (this.hasAccess === undefined)
        await new Promise(resolve => setTimeout(resolve, 100));
        this.configService.configStatus.subscribe(status => {
          this.hasAccess = status;
          if (!this.hasAccess) { this.router.navigate(['config']) };
        });

      }
    })();

    return true;
  }
}
