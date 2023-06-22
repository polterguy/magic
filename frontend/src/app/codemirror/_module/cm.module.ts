
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CodemirrorModule } from "@ctrl/ngx-codemirror";
import { HyperlambdaComponent } from "../codemirror-hyperlambda/codemirror-hyperlambda.component";
import { CodemirrorSqlComponent } from "../codemirror-sql/codemirror-sql.component";

@NgModule({
  declarations: [
    CodemirrorSqlComponent,
    HyperlambdaComponent
  ],
  imports: [
    CommonModule,
    CodemirrorModule,
    FormsModule
  ],
  exports: [
    CodemirrorSqlComponent,
    HyperlambdaComponent
  ]
})
export class CmModule { }
