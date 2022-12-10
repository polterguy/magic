
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { GeneralService } from '../../services/general.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { Router } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-backends-list',
  templateUrl: './backends-list.component.html',
  styleUrls: ['./backends-list.component.scss']
})
export class BackendsListComponent implements OnInit {

  /**
   * List of existing backends
   */
  public backendsList: any = [];

  /**
   * Table's columns initiation
   */
  displayedColumns: string[] = ['username', 'backendURL', 'status', 'actions'];

  /**
   * Specifies the currently in-use backend.
   */
  public activeBackend: string = '';

  /**
   * Turns to true when backendService is ready.
   */
  public isLoading: boolean = true;

  constructor(
    private router: Router,
    private dialogRef: DialogRef<BackendsListComponent>,
    private clipboard: Clipboard,
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private backendService: BackendService) { }

  ngOnInit() {
    this.getBackends();
  }

  private getBackends() {
    this.backendsList = this.backendService.backends;
    this.activeBackend = this.backendService.active.url;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  copyUrlWithBackend(url: string) {
    const currentURL = window.location.protocol + '//' + window.location.host;
    const param = currentURL + '?backend='
    this.clipboard.copy(param + encodeURIComponent(url));
    this.generalService.showFeedback('Backend URL was copied to your clipboard');
  }

  /**
   * Switching to specified backend.
   *
   * @param backend Backend to switch to
   */
  switchBackend(backend: Backend) {
    this.isLoading = true;
    this.isLoading = false;
    this.router.navigate(['/authentication/login'], {
      queryParams: { switchTo: backend.url }
    });
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  /**
   * Removes specified backend from local storage
   *
   * @param backend Backend to remove
   */
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

  public addNew() {
    window.location.href = '/authentication/login';
  }
}
