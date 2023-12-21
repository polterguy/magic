
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateKeyValueDialogComponent } from '../create-key-value-dialog/create-key-value-dialog.component';

/**
 * Formly key/value extension field.
 */
@Component({
  selector: 'app-formly-key-value',
  template: `
<div class="w-100 standalone-field">
  <mat-chip-list>
    <mat-chip
      *ngFor="let item of items"
      (removed)="removeArgument(item)"
      [removable]="true">
      {{item.name}}:{{item.value}}
      <mat-icon matChipRemove>cancel</mat-icon>
    </mat-chip>
    <mat-chip (click)="addItem()">
      Add
      <mat-icon>add</mat-icon>
    </mat-chip>
  </mat-chip-list>
</div>`,
  styleUrls: ['./formly-key-value.scss'],
})
export class FormlyKeyValueComponent extends FieldType<FieldTypeConfig> implements OnInit {

  items: any[] = [];

  constructor(private dialog: MatDialog) {

    super();
  }

  ngOnInit() {

    this.createItems();
  }

  removeArgument(el: any) {

    delete this.model[<string>this.field.key][el.name];
    this.createItems();
  }

  addItem() {

    this.dialog.open(CreateKeyValueDialogComponent, {
      width: '80vw',
      maxWidth: '512px',
    }).afterClosed().subscribe((result: any) => {

      if (result) {

        this.model[<string>this.field.key][result.key] = result.value;
        this.createItems();
      }
    });
}

  /*
   * Private helpers.
   */

  private createItems() {

    this.items = [];
    for (var idx in this.model[<string>this.field.key]) {
      this.items.push({
        name: idx,
        value: this.model[<string>this.field.key][idx],
      });
    }
  }
}
