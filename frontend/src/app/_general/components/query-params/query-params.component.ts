
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { Argument } from '../../../_protected/pages/manage/endpoints/_models/argument.model';

/**
 * Model class for dialog.
 */
export class ArgumentModel {

  /**
   * Argument we're currently creating a value for.
   */
  argument: Argument;

  /**
   * All arguments for endpoint.
   */
  all: Argument[];

  /**
   * Old value for query argumant, if any.
   */
  old: any;
}

@Component({
  selector: 'app-query-params',
  templateUrl: './query-params.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class QueryParamsComponent implements OnInit {

  @Input() item: any;
  @Input() allItems: any;

  /**
   * Model for value of query parameter.
   */
  value: any;

  /**
   * Data model for operator types of arguments.
   */
  operators: string[] = [
    'or',
    'and',
  ];

  /**
   * Possible sort order directions for sorting result.
   */
  directions: string[] = [
    'asc',
    'desc',
  ];

  /**
   * Columns user can sort endpoint by.
   */
  orders: string[] = [];

  ngOnInit() {
    this.setParams();
  }

  setParams() {
    if (this.item) {
      if (this.item.name === 'order' && this.item.type === 'string') {
        this.orders = this.allItems.filter(x => x.name.endsWith('.eq')).map(x => x.name.substring(0, x.name.length - 3));
        // this.value = this.item.old ?? '';
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
