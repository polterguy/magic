
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Status } from 'src/app/models/status.model';
import { EndpointsGeneralService } from 'src/app/_general/services/endpoints-general.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';

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
    private router: Router,
    private backendService: BackendService) {}

  ngOnInit(): void {
    this.onWindowResize();
    this.backendService.authenticatedChanged.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.backendService.activeBackendChanged.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.backendService.endpointsFetched.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.backendService.versionRetrieved.subscribe(() => {
      this.cdr.detectChanges();
    });

    // Subscribing to status changes and redirect accordingly if we need user to setup system.
    this.backendService.statusRetrieved.subscribe((status: Status) => {
      if (status) {
        if (!status.result) {
          this.router.navigate(['/configurations/setup']);
        }
      }
    });
  }
}
