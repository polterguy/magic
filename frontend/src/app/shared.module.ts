
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DateSincePipe } from "./_general/pipes/date-since.pipe";
import { MarkedPipe } from "./_general/pipes/marked.pipe";
import { DatePipe } from "./_general/pipes/date.pipe";
import { SortByPipe } from "./_general/pipes/sort-by.pipe";

@NgModule({
  declarations: [
    DateSincePipe,
    DatePipe,
    MarkedPipe,
    SortByPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DateSincePipe,
    DatePipe,
    MarkedPipe,
    SortByPipe
  ]
})
export class SharedModule { }
