
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Helper components imports
import { CodemirrorModule } from "@ctrl/ngx-codemirror";

// Application specific imports
import { DateSincePipe } from "src/app/pipes/date-since.pipe";
import { MarkedPipe } from "src/app/pipes/marked.pipe";
import { DatePipe } from "src/app/pipes/date.pipe";
import { SortByPipe } from "src/app/pipes/sort-by.pipe";
import { MaterialModule } from "./material.module";

@NgModule({
  declarations: [
    DateSincePipe,
    DatePipe,
    MarkedPipe,
    SortByPipe,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CodemirrorModule,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    DateSincePipe,
    DatePipe,
    MarkedPipe,
    SortByPipe,
    MaterialModule,
    CodemirrorModule,
  ]
})
export class SharedModule { }
