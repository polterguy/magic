
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Application specific imports
import { MaterialModule } from "./material.module";
import { DatePipe } from "src/app/pipes/date.pipe";
import { MarkedPipe } from "src/app/pipes/marked.pipe";
import { SortByPipe } from "src/app/pipes/sort-by.pipe";
import { DateSincePipe } from "src/app/pipes/date-since.pipe";
import { NoSanitizePipe } from "../pipes/nosanitizerpipe";

@NgModule({
  declarations: [
    DateSincePipe,
    DatePipe,
    MarkedPipe,
    SortByPipe,
    NoSanitizePipe,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    DateSincePipe,
    DatePipe,
    MarkedPipe,
    SortByPipe,
    NoSanitizePipe,
    MaterialModule,
  ]
})
export class SharedModule { }
