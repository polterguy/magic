
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';

/**
 * Loading skeleton component showing user some animations while we wait for something to load from the backend.
 */
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

  ngOnInit() {
    this.generateArray();
  }

  generateArray() {
    for (let index = 0; index < this.amount; index++) {
      this.itemsArray.push('item' + index);
    }
  }
}
