
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { UpdatePwaService } from 'src/app/services/update-pwa.service';
import { GeneralService } from 'src/app/services/general.service';
import { BackendService } from 'src/app/services/backend.service';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html'
})
export class CoreComponent implements OnInit, OnDestroy {

  private largeScreenStatus!: boolean;

  largeScreen!: boolean;
  hubConnection: HubConnection;

  // Needed to be able to figure out if we're on a small screen or not.
  @HostListener('window:resize', ['$event'])
  private onWindowResize() {

    const getScreenWidth = window.innerWidth;
    this.largeScreenStatus = getScreenWidth >= 992 ? true : false;
    this.generalService.setScreenSize(this.largeScreenStatus);
  }

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

    // Creating socket channel
    let builder = new HubConnectionBuilder();
    this.hubConnection = builder.withUrl(this.backendService.active.url + '/sockets', {
      accessTokenFactory: () => this.backendService.active.token.token,
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    }).build();

    this.hubConnection.start();
    this.hubConnection.on('magic.backend.message', (args) => {
      args = JSON.parse(args);

      switch (args.type) {

        case 'success':
          this.generalService.showFeedback(args.message, 'successMessage', 'OK');
          break;

        case 'error':
          this.generalService.showFeedback(args.message, 'errorMessage', 'OK', 10000);
          break;
      }
    });
  }

  ngOnDestroy() {

    this.hubConnection?.stop();
  }
}
