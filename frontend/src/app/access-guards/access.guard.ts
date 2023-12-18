
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
import { BackendService } from '../services/backend.service';

/**
 * Access guard verifying router link can be activated.
 */
@Injectable({
  providedIn: 'root'
})
export class AccessGuard implements CanActivate {

  hasAccess: boolean = undefined;

  constructor(
    private router: Router,
    private backendService: BackendService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return (async () => {

      if (this.backendService.active?.token?.in_role('root')) {
        return true;
      }

      this.router.navigate(['/authentication/login/'], {
        queryParams: route.queryParams
      });

    })();

  }
}
