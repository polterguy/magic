
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
  selector: 'app-create-array-dialog',
  templateUrl: './create-array-dialog.component.html',
  styleUrls: ['./create-array-dialog.component.scss']
})
export class CreateArrayDialogComponent implements OnInit {

  autocompleter = new FormControl('');
  filteredOptions: Observable<string[]>;

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CreateArrayDialogComponent>) { }

  ngOnInit() {

    this.filteredOptions = this.autocompleter.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  onSubmit() {


    if (this.autocompleter.value === '') {

      this.generalService.showFeedback('Please provide a value', 'errorMessage');
      return;
    }

    this.dialogRef.close(this.autocompleter.value);
  }

  /*
   * Private helper methods
   */

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.data.options.filter(option => option.label.toLowerCase().includes(filterValue));
  }
}
