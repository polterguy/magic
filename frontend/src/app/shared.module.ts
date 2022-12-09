
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DateFromPipe } from "./_general/pipes/date-from.pipe";
import { DateSincePipe } from "./_general/pipes/date-since.pipe";
import { DynamicPipe } from "./_general/pipes/dynamic.pipe";
import { MarkedPipe } from "./_general/pipes/marked.pipe";
import { DatePipe } from "./_general/pipes/date.pipe";
import { SortByPipe } from "./_general/pipes/sort-by.pipe";

@NgModule({
  declarations: [
    DateFromPipe,
    DateSincePipe,
    DatePipe,
    DynamicPipe,
    MarkedPipe,
    SortByPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DateFromPipe,
    DateSincePipe,
    DatePipe,
    DynamicPipe,
    MarkedPipe,
    SortByPipe
  ]
})
export class SharedModule { }
