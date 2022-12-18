
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { UpdatePwaService } from 'src/app/_general/services/update-pwa.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html'
})
export class CoreComponent implements OnInit {

  public largeScreen!: boolean;

  private largeScreenStatus!: boolean;
  // Needed to be able to figure out if we're on a small screen or not.
  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    const getScreenWidth = window.innerWidth;
    this.largeScreenStatus = getScreenWidth >= 992 ? true : false;
    this.generalService.setScreenSize(this.largeScreenStatus);
  }

  /**
   * Creates an instance of your component.
   *
   * @param cdr Needed to mark component as having changes
   * @param backendService Service to keep track of currently selected backend
   */
  constructor(
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private backendService: BackendService,
    private updatePwaService: UpdatePwaService) {
    this.updatePwaService.checkForUpdates();
  }

  ngOnInit() {
    this.onWindowResize();
    this.backendService.authenticatedChanged.subscribe((res: any) => {
      this.cdr.detectChanges();
    });
    this.backendService.activeBackendChanged.subscribe((res: any) => {
      this.cdr.detectChanges();
    });
    this.backendService.versionRetrieved.subscribe((res: any) => {
      this.cdr.detectChanges();
    });
  }
}
