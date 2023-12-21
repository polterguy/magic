
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { CreateArrayDialogComponent } from './components/create-array-dialog/create-array-dialog.component';

/**
 * Formly key/value extension field.
 */
@Component({
  selector: 'app-formly-array',
  template: `
<div class="w-100 standalone-field mb-4">
  <mat-chip-list>
    <mat-chip
      *ngFor="let item of items"
      (removed)="removeArgument(item)"
      [removable]="true">
      {{item}}
      <mat-icon matChipRemove>cancel</mat-icon>
    </mat-chip>
    <mat-chip (click)="addItem()">
      Add
      <mat-icon>add</mat-icon>
    </mat-chip>
  </mat-chip-list>
</div>`,
  styleUrls: ['./formly-array.scss'],
})
export class FormlyArrayComponent extends FieldType<FieldTypeConfig> implements OnInit {

  items: string[] = [];

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService) {

    super();
  }

  ngOnInit() {

    this.createItems();
  }

  removeArgument(el: any) {

    this.model[<string>this.field.key].splice(this.model[<string>this.field.key].indexOf(el), 1);
    this.createItems();
  }

  addItem() {

    this.dialog.open(CreateArrayDialogComponent, {
      width: '80vw',
      maxWidth: '512px',
    }).afterClosed().subscribe((result: any) => {

      if (result) {

        this.model[<string>this.field.key].push(result);
        this.createItems();
      }
    });
}

  /*
   * Private helpers.
   */

  private createItems() {

    this.items = [];
    for (var idx of this.model[<string>this.field.key]) {
      this.items.push(idx);
    }
  }
}
