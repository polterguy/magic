
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Endpoint } from './_models/endpoint.model';
import { BehaviorSubject, Subscription } from 'rxjs';
import { EndpointsGeneralService } from 'src/app/_general/services/endpoints-general.service';

@Component({
  selector: 'app-generated-endpoints',
  templateUrl: './generated-endpoints.component.html',
  styleUrls: ['./generated-endpoints.component.scss']
})
export class GeneratedEndpointsComponent implements OnInit, OnDestroy {

  public selectedDb: string = 'Magic';

  /**
   * Model describing endpoints in your installation.
   */
  endpoints: any = [];

  originalEndpoints: any = [];

  /**
   * Specifies what list to be displayed by default.
   */
  public defaultListToShow: string = '';

  /**
   * Stores the search key to be passed to the list.
   */
  public searchKey: string = '';

  public itemToBeTried = new BehaviorSubject<any>({});

  private endpointSubscription!: Subscription;

  public isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor(
    private generalService: GeneralService,
    private endpointsGeneralService: EndpointsGeneralService) { }

  ngOnInit(): void {
    this.getEndpoints();
  }

  /*
   * Invokes backend to retrieve meta data about endpoints.
   */
  private getEndpoints() {
    this.endpointSubscription = this.endpointsGeneralService.endpoints.subscribe({
      next: (endpoints: Endpoint[]) => {
        if (endpoints) {
          let groups: any = [];

          groups['other'] = endpoints.reduce((item: any, x: any) => {
            if (x.type !== 'internal' && !x.path.startsWith('magic/system/magic/')) {
              let paths: any[] = x.path.split('/');
              paths.splice(0, 1);
              paths.splice(2);
              const path = paths.join('/');
              item[path] = item[path] || [];
              item[path].push(x);
            }
            return item;
          }, Object.create(null));

          groups['system'] = endpoints.reduce((item: any, x: any) => {
            let paths: any[] = x.path.split('/');
            paths.splice(0, 1);
            paths.splice(2);
            const path = paths.join('/');
            item[path] = item[path] || [];
            item[path].push(x);
            return item;
          }, Object.create(null));

          if (groups['other'] && Object.keys(groups['other']).length) {
            this.defaultListToShow = 'other';

          } else {
            this.defaultListToShow = 'system';
          }

          this.originalEndpoints = groups;
          this.endpoints = { ...this.originalEndpoints };

          this.isLoading.next(false);
        }
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });

    this.endpointsGeneralService.getEndpoints();
  }

  reloadEndpoints(e: any) {
    this.getEndpoints();
  }

  public filterList(event: any) {
    this.defaultListToShow = event.showSystem ? 'system' : 'other';
    let instance: any = { ...this.originalEndpoints[this.defaultListToShow] };
    if (event.searchKey) {
      Object.keys(instance).map((element: any) => {
        instance[element] = instance[element].filter((el: any) => el.path.indexOf(event.searchKey) > -1)
      });
    }
    this.endpoints[this.defaultListToShow] = instance;
  }

  public changeEditor(event: any) {
    this.itemToBeTried.next(event);
  }

  ngOnDestroy(): void {
    this.endpointSubscription.unsubscribe();
  }
}
