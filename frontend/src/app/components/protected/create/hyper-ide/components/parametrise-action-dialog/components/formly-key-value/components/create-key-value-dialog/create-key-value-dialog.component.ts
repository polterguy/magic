
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, map, startWith } from 'rxjs';

// Application specific imports.
import { GeneralService } from 'src/app/services/general.service';

/**
 * Modal dialog allowing you to create a new key/value pair.
 */
@Component({
  selector: 'app-create-key-value-dialog',
  templateUrl: './create-key-value-dialog.component.html',
  styleUrls: ['./create-key-value-dialog.component.scss']
})
export class CreateKeyValueDialogComponent implements OnInit {

  autocompleter = new FormControl('');
  filteredOptions: Observable<string[]>;
  key: string;

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CreateKeyValueDialogComponent>) { }

  ngOnInit() {

    if (this.data?.item) {
      this.key = this.data.item.key;
      this.autocompleter.setValue(this.data.item.value);
    }
    this.filteredOptions = this.autocompleter.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  onSubmit() {


    if (!this.key || this.key === '' || this.autocompleter.value === '') {

      this.generalService.showFeedback('Please provide both key and value', 'errorMessage');
      return;
    }

    this.dialogRef.close({
      key: this.key,
      value: this.autocompleter.value,
      edit: !!this.data,
    });
  }

  /*
   * Private helper methods
   */

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.data.options.filter(option => option.label.toLowerCase().includes(filterValue));
  }
}
