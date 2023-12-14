
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Endpoint } from '../../../../_general/models/endpoint.model';
import { BehaviorSubject } from 'rxjs';
import { EndpointService } from 'src/app/_general/services/endpoint.service';

/**
 * Endpoints component for displaying endpoints to user in a Swagger like UI, allowing
 * the user to invoke endpoints, and/or see meta information associated with endpoints.
 */
@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit  {

  endpoints: any = [];
  originalEndpoints: any = [];
  defaultListToShow: string = '';
  searchKey: string = '';
  itemToBeTried = new BehaviorSubject<any>({});
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private generalService: GeneralService,
    private endpointsService: EndpointService) { }

  ngOnInit() {

    this.getEndpoints();
  }

  reloadEndpoints() {

    this.getEndpoints();
  }

  filterList(event: { searchKey: string, checked: boolean }) {

    this.defaultListToShow = event.checked ? 'system' : 'other';
    let instance: any = { ...this.originalEndpoints[this.defaultListToShow] };
    if (event.searchKey) {
      Object.keys(instance).map((element: any) => {
        instance[element] = instance[element].filter((el: any) => el.path.indexOf(event.searchKey) > -1)
      });
    }
    this.endpoints[this.defaultListToShow] = instance;
  }

  changeEditor(event: any) {

    this.itemToBeTried.next(event);
  }

  /*
   * Private helper methods.
   */

  private getEndpoints() {

    this.isLoading.next(true);
    this.generalService.showLoading();
    this.endpointsService.endpoints().subscribe({

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
        this.generalService.hideLoading();
      },

      error: (error: any) => {

        this.isLoading.next(false);
        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
