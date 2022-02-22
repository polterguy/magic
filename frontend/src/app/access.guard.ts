import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './components/management/auth/services/auth.service';
import { ConfigService } from './components/management/config/services/config.service';

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
