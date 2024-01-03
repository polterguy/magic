
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Component, OnInit } from '@angular/core';
import { Observable, debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs';
import { SqlService } from 'src/app/services/sql.service';
import { GeneralService } from 'src/app/services/general.service';

// Application specific imports

/**
 * Formly autocomplete extension field.
 */
@Component({
  selector: 'app-formly-autocomplete',
  template: `
<mat-form-field class="w-100 standalone-field mb-2">
  <mat-label>{{field.props.label}}</mat-label>
  <input
    [id]="field.key"
    type="text"
    [placeholder]="field.props.label"
    matInput
    [formControl]="formControl"
    [matAutocomplete]="auto">
  <mat-autocomplete #auto="matAutocomplete">
    <mat-option
      *ngFor="let option of filteredOptions | async;"
      [class]="option.complete === false ? 'warning' : ''"
      [matTooltip]="option.complete === false ? 'Incomplete expression, cannot deduce complete path' : ''"
      matTooltipPosition="right"
      [value]="option.value">{{option.label}}</mat-option>
  </mat-autocomplete>
</mat-form-field>
`,
  styleUrls: ['./formly-autocomplete.scss']
})
export class FormlyAutocompleteComponent extends FieldType<FieldTypeConfig> implements OnInit {

  filteredOptions: Observable<string[]>;

  constructor(
    private sqlService: SqlService,
    private generalService: GeneralService,) {

    super();
  }

  ngOnInit() {

    this.filteredOptions = this.formControl.valueChanges.pipe(
      startWith(this.model[<string>this.field.key]),
      map(value => this._filter(value || '')),
    );
    this.formControl.setValue(this.field.model[<string>this.field.key]);
    this.formControl.valueChanges.subscribe((val: string) => {
      this.model[<string>this.field.key] = val;
    });

    if (this.field.key === 'connection-string') {
      if (this.form.controls['database-type']) {
        this.form.controls['database-type'].valueChanges.pipe(
          debounceTime(400),
          distinctUntilChanged(),
          tap(() => {
              this.getConnectionStrings();
          })).subscribe();
      }
    } else if (this.field.key === 'database') {
      if (this.form.controls['database-type'] && this.form.controls['connection-string']) {
        this.form.controls['connection-string'].valueChanges.pipe(
          debounceTime(400),
          distinctUntilChanged(),
          tap(() => {
              this.getDatabases();
          })).subscribe();
      }
    } else if (this.field.key === 'table') {
      if (this.form.controls['database-type'] && this.form.controls['connection-string'] && this.form.controls['table']) {
        this.form.controls['database'].valueChanges.pipe(
          debounceTime(400),
          distinctUntilChanged(),
          tap(() => {
              this.getTables();
          })).subscribe();
      }
    }
  }

  /*
   * Private helper methods.
   */

  private getConnectionStrings() {

    if (!this.model['database-type'] || this.model['database-type'] === '') {
      return;
    }

    this.generalService.showLoading();
    this.sqlService.connectionStrings(<string>this.model['database-type']).subscribe({

      next: (result: any) => {

        this.generalService.hideLoading();
        const expOptions = (<any[]>this.field.props.options).filter(x => x.value.startsWith(':x:'));
        this.field.props.options = [];
        for (const idx in result) {
          this.field.props.options.push({
            value: idx,
            label: idx,
            complete: true,
          });
        }
        for (const idx of expOptions) {
          this.field.props.options.push(idx);
        }
        this.formControl.setValue('');
      },

      error: () => {

        this.generalService.hideLoading();
      }
    });
  }

  private getDatabases() {

    if (!this.model['database-type'] || this.model['database-type'] === '' ||
        !this.model['connection-string'] || this.model['connection-string'] === '') {
      return;
    }

    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo(
      <string>this.model['database-type'],
      <string>this.model['connection-string']).subscribe({

      next: (result: any) => {

        this.generalService.hideLoading();
        const expOptions = (<any[]>this.field.props.options).filter(x => x.value.startsWith(':x:'));
        this.field.props.options = [];
        for (const idx of result.databases) {
          this.field.props.options.push({
            value: idx.name,
            label: idx.name,
            complete: true,
          });
        }
        for (const idx of expOptions) {
          this.field.props.options.push(idx);
        }
        this.formControl.setValue('');
      },

      error: () => {

        this.generalService.hideLoading();
      }
    });
  }

  private getTables() {

    if (!this.model['database-type'] || this.model['database-type'] === '' ||
        !this.model['connection-string'] || this.model['connection-string'] === '' ||
        !this.model['database'] || this.model['database'] === '') {
      return;
    }

    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo(
      <string>this.model['database-type'],
      <string>this.model['connection-string']).subscribe({

      next: (result: any) => {

        this.generalService.hideLoading();
        const db = result.databases.filter((x: any) => x.name === <string>this.model['database'])[0];
        const expOptions = (<any[]>this.field.props.options).filter(x => x.value.startsWith(':x:'));
        this.field.props.options = [];
        for (const idx of db.tables) {
          this.field.props.options.push({
            value: idx.name,
            label: idx.name,
            complete: true,
          });
        }
        for (const idx of expOptions) {
          this.field.props.options.push(idx);
        }
        this.formControl.setValue('');
      },

      error: () => {

        this.generalService.hideLoading();
      }
    });
  }

  private _filter(value: string): any[] {

    if (!value) {
      return <any[]>this.field.props.options;
    }

    const filterValue = value.toLowerCase();
    return (<any[]>this.field.props.options).filter(option => option.label.toLowerCase().includes(filterValue));
  }
}
