
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  templateUrl: './loading-skeleton.component.html',
  styleUrls: ['./loading-skeleton.component.scss']
})
export class LoadingSkeletonComponent implements OnInit {

  @Input() amount: number = 2;
  @Input() colClass: string = 'col-12';
  @Input() blockHeight: string = '375px';
  @Input() hasShadow: boolean = true;

  public itemsArray: string[] = [];

  constructor() { }

  ngOnInit(): void {
    this.generateArray();
  }

  generateArray() {
    for (let index = 0; index < this.amount; index++) {
      this.itemsArray.push('item' + index);
    }
  }
}
