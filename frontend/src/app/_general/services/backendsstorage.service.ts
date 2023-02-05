
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Backend } from 'src/app/_protected/models/common/backend.model';

// Application specific imports.
import { environment } from 'src/environments/environment';

/**
 * Service containing list of all backends in the system responsible for persisting
 * your backends and keeping track of usernames, passwords and tokens associated with
 * each of your backends.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendsStorageService {

  private _backends: Backend[] = [];

  constructor() {

    let backends: any[] = [];
    const storage = localStorage.getItem('magic.backends');
    if (storage) {
      backends = <any[]>JSON.parse(storage);
    } else if (window.location.href.indexOf('http://localhost') !== -1) {
      backends = environment.defaultBackends;
    }
    this._backends = backends.map(x => new Backend(x.url, x.username, x.password, x.token));
  }

  get active() {

    return this._backends.length === 0 ? null : this._backends[0];
  }

  get backends() {

    return this._backends;
  }

  upsert(value: Backend) {

    const existing = this._backends.filter(x => x.url === value.url);
    if (existing.length > 0) {
      existing[0].username = value.username;
      existing[0].password = value.password;
      existing[0].token = value.token;
    } else {
      this._backends.push(value);
    }
    this.persistBackends();
    return existing.length === 0;
  }

  activate(value: Backend) {

    this._backends = this._backends.sort((lhs, rhs) => {
      if (lhs.url === value.url) {
        return -1;
      } else if (rhs.url === value.url) {
        return 1;
      }
      return 0;
    });
    this.persistBackends();
    return this._backends[0];
  }

  remove(value: Backend) {

    const removed = this._backends.splice(this._backends.indexOf(value), 1);
    if (removed.length === 0) {
      throw 'No such backend';
    }
    this.persistBackends();
  }

  set backends(value: Backend[]) {

    this._backends = value;
  }

  persistBackends() {

    const toPersist: any[] = [];
    for (const idx of this._backends) {
      var idxPersist: any = {
        url: idx.url,
      };
      if (idx.username) {
        idxPersist.username = idx.username;
      }
      if (idx.password) {
        idxPersist.password = idx.password;
      }
      if (idx.token && !idx.token.expired) {
        idxPersist.token = idx.token.token;
      }
      toPersist.push(idxPersist);
    }
    localStorage.setItem('magic.backends', JSON.stringify(toPersist));
  }
}
