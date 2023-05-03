
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';

/**
 * Component allowing user to declare query parameters for executing endpoint.
 */
@Component({
  selector: 'app-query-params',
  templateUrl: './query-params.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class QueryParamsComponent implements OnInit {

  @Input() item: any;
  @Input() allItems: any;

  value: any;
  operators: string[] = [
    'or',
    'and',
  ];
  directions: string[] = [
    'asc',
    'desc',
  ];
  orders: string[] = [];

  ngOnInit() {

    this.setParams();
  }

  setParams() {

    if (this.item) {

      if (this.item.name === 'order' && this.item.type === 'string') {

        this.orders = this.allItems.filter((x:any) => x.name.endsWith('.eq')).map((x: any) => x.name.substring(0, x.name.length - 3));

      } else if (this.item.name === 'direction' && this.item.type === 'string') {

        this.value = this.directions.filter(x => x === 'asc')[0];

      } else if (this.item.name === 'operator' && this.item.type === 'string') {

        this.value = this.operators.filter(x => x === 'and')[0];

      } else {

        switch (this.item.type) {

          case 'bool':
            this.value = true;
            break;

          case 'string':
            this.value = '';
            break;

          case 'long':
          case 'int':
          case 'uint':
          case 'short':
          case 'ushort':
            this.value = 42;
            break;

          case 'date':
            this.value = new Date().toISOString();
            break;
        }
      }
    }
  }
}
