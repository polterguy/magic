
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/_general/services/backend.service';
import { Backend } from 'src/app/_protected/models/common/backend.model';

@Component({
  selector: 'app-auto-auth',
  templateUrl: './auto-auth.component.html'
})
export class AutoAuthComponent implements OnInit {

  constructor(
    private backendService: BackendService,
    private activatedRoute: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((params: any) => {
      this.getParams(params);
    });
  }

  /*
   * Retrieving URL parameter
   */
  private getParams(params: any) {

    // Checking if user accessed system with a link containing query param pointing to specific backend.
    const backend = params.params['backend'];
    if (backend) {
      const cur = new Backend(backend);

      // Making sure we keep existing username, password and token, if we have these values.
      const old = this.backendService.backends.filter(x => x.url === cur.url);
      if (old.length > 0) {
        cur.username = old[0].username;
        cur.password = old[0].password;
        cur.token = old[0].token;
      }
      this.backendService.activate(cur);
      this.backendService.upsert(cur);

      if (cur.token === null) {
        this.router.navigate(['/authentication/login/'], {
          queryParamsHandling: 'preserve'
        });
      } else {
        window.location.href = '/';
      }

    } else {

      // Checking if user has some sort of token, implying reset-password token or verify-email token.
      const token = params.params['token'];
      if (token && token.includes('.')) {

        /*
         * 'token' query parameter seems to be a JWT token.
         *
         * Authentication request, authenticating using specified link,
         * and redirecting user to hide URL.
         */
        const url = params.params['url'];
        const username = params.params['username'];
        const backend = new Backend(url, username, null, token);
        this.backendService.upsert(backend);
        this.backendService.activate(backend);
        this.backendService.verifyToken().subscribe({
          next: () => {

            // Checking if this is an impersonation request or a change-password request.
            if (this.backendService.active.token.in_role('reset-password')) {

              // Change password request.
              this.router.navigate(['/authentication/reset-password']);

            } else {

              // Impersonation request.
              this.router.navigate(['/']);
            }
          },
        });

      } else if (token) {

        /*
         * 'token' seems to be a "verify email address" type of token since it doesn't contain "." characters.
         *
         * Need to set the current backend first.
         */
        const backend = new Backend(params.params['url'], params.params['username']);
        this.backendService.upsert(backend);
        this.backendService.activate(backend);
        this.router.navigate(['/']);
        
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
