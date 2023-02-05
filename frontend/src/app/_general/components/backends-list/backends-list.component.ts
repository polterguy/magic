
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from '../../services/general.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { Router } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';

/**
 * Helper component to display list of all backends, allowing user to switch backend, and/or
 * change to another backend.
 */
@Component({
  selector: 'app-backends-list',
  templateUrl: './backends-list.component.html',
  styleUrls: ['./backends-list.component.scss']
})
export class BackendsListComponent implements OnInit {

  backendsList: any = [];
  displayedColumns: string[] = ['username', 'backendURL', 'status', 'actions'];
  activeBackend: string = '';

  constructor(
    private router: Router,
    private dialogRef: DialogRef<BackendsListComponent>,
    private clipboard: Clipboard,
    private generalService: GeneralService,
    private backendService: BackendService) { }

  ngOnInit() {

    this.backendsList = this.backendService.backends;
    this.activeBackend = this.backendService.active.url;
  }

  copyUrlWithBackend(url: string) {

    const currentURL = window.location.protocol + '//' + window.location.host;
    const param = currentURL + '?backend='
    this.clipboard.copy(param + encodeURIComponent(url));
    this.generalService.showFeedback('Backend URL can be found on your clipboard');
  }

  switchBackend(backend: Backend) {

    this.router.navigate(['/authentication/login'], {
      queryParams: { switchTo: backend.url }
    });
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  removeBackend(backend: Backend) {

    if (this.backendsList.length === 1) {
      const anotherWithToken: any = this.backendsList.find((item: any) => item !== backend && item.token !== null);
      if (anotherWithToken) {
        this.switchBackend(anotherWithToken);
        return;
      }
    }

    this.backendService.remove(backend);
    if (this.backendService.backends.length === 0) {
      this.addNew();
      return;
    } else {
      this.backendsList = this.backendService.backends;
    }
    this.dialogRef.close();
  }

  addNew() {

    window.location.href = '/authentication/login';
  }
}
