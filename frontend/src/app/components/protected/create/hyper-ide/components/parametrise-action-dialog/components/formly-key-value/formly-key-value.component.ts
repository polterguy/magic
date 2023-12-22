
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateKeyValueDialogComponent } from './components/create-key-value-dialog/create-key-value-dialog.component';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Formly key/value extension field.
 */
@Component({
  selector: 'app-formly-key-value',
  template: `
<div class="w-100 standalone-field mb-4">
  <mat-chip-list>
    <mat-chip
      *ngFor="let item of items"
      (removed)="removeArgument(item)"
      (click)="addEditItem(item)"
      [removable]="true">
      {{item.key}}:{{item.value}}
      <mat-icon matChipRemove>cancel</mat-icon>
    </mat-chip>
    <mat-chip (click)="addEditItem(null)">
      Add
      <mat-icon>add</mat-icon>
    </mat-chip>
  </mat-chip-list>
</div>`,
  styleUrls: ['./formly-key-value.scss'],
})
export class FormlyKeyValueComponent extends FieldType<FieldTypeConfig> implements OnInit {

  items: any[] = [];

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService) {

    super();
  }

  ngOnInit() {

    this.createItems();
  }

  removeArgument(el: any) {

    delete this.model[<string>this.field.key][el.key];
    this.createItems();
  }

  addEditItem(item: any) {

    this.dialog.open(CreateKeyValueDialogComponent, {
      width: '80vw',
      maxWidth: '512px',
      data: {
        item: item || null,
        options: this.props.options,
      }
    }).afterClosed().subscribe((result: any) => {

      if (result) {

        if (!this.model[<string>this.field.key]) {
          this.model[<string>this.field.key] = {};
        }
        if (item === null && this.model[<string>this.field.key][result.key]) {

          this.generalService.showFeedback('That key already exists', 'errorMessage');
          return;
        }

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
        key: idx,
        value: this.model[<string>this.field.key][idx],
      });
    }
  }
}
