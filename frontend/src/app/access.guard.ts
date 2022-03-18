
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { ConfigService } from './services/management/config.service';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { BackendService } from './services/backend.service';

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
    private configService: ConfigService,
    private backendService: BackendService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    (async () => {
      while (!this.backendService.active?.token)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.backendService.active?.token) {
        this.configService.configStatus.subscribe(status => {
          if (status !== undefined) {
            this.hasAccess = status;
            if (!this.hasAccess) { this.router.navigateByUrl('/config'); return false; };
          }
        });
      }
    })();

    /**
     * checking access rights per route
     */
    (async () => {
      while (Object.keys(this.backendService.active?.access.auth).length === 0)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      if (Object.keys(this.backendService.active?.access.auth).length !== 0) {
        if (!(this.backendService.active?.access.crud.generate_crud || this.backendService.active?.access.crud.generate_sql || this.backendService.active?.access.crud.generate_frontend)) {
          route.data.page === 'crudifier' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.files.list_files && this.backendService.active?.access.files.list_folders)) {
          route.data.page === 'ide' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.sql.execute_access)) {
          route.data.page === 'sql' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.eval.execute)) {
          route.data.page === 'evaluator' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.tasks.read)) {
          route.data.page === 'tasks' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.auth.view_users && this.backendService.active?.access.auth.view_roles)) {
          route.data.page === 'auth' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.terminal.execute)) {
          route.data.page === 'terminal' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.crypto.import_public_key)) {
          route.data.page === 'crypto' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active)) {
          route.data.page === 'profile' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.bazar.get_manifests)) {
          route.data.page === 'bazar' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.log.read)) {
          route.data.page === 'log' || route.data.page === 'assumptions' || route.data.page === 'cache' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.endpoints.view)) {
          route.data.page === 'endpoints' ? this.router.navigateByUrl('') : '';
        } else if (!(this.backendService.active?.access.sockets.read)) {
          route.data.page === 'sockets' ? this.router.navigateByUrl('') : '';
        }
      }
    })();

    return true;
  }
}
