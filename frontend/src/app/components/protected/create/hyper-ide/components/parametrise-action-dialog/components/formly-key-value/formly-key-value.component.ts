
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

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
    <mat-chip>
      Add
      <mat-icon>add</mat-icon>
    </mat-chip>
  </mat-chip-list>
</div>`,
  styleUrls: ['./formly-key-value.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormlyKeyValueComponent extends FieldType<FieldTypeConfig> implements OnInit {

  items: any[] = [];

  constructor() {

    super();
  }

  ngOnInit() {

    this.createItems();
  }

  removeArgument(el: any) {

    delete this.model[<string>this.field.key][el.name];
    this.createItems();
  }

  /*
   * Private helpers.
   */

  createItems() {

    this.items = [];
    for (var idx in this.model[<string>this.field.key]) {
      this.items.push({
        name: idx,
        value: this.model[<string>this.field.key][idx],
      });
    }
  }
}
