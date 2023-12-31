
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Component, OnInit } from '@angular/core';
import { Observable, map, startWith } from 'rxjs';

// Application specific imports
import { GeneralService } from 'src/app/services/general.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MatAutocompleteActivatedEvent } from '@angular/material/autocomplete';

/**
 * Formly workflow extension field.
 */
@Component({
  selector: 'app-formly-workflow',
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
  <mat-autocomplete #auto="matAutocomplete" (optionSelected)="optionSelected($event)">
    <mat-option
      *ngFor="let option of filteredOptions | async;"
      [class]="option.complete === false ? 'warning' : ''"
      [matTooltip]="option.complete === false ? 'Incomplete expression, cannot deduce complete path' : ''"
      matTooltipPosition="right"
      [value]="option.value">{{option.label}}</mat-option>
  </mat-autocomplete>
</mat-form-field>
`,
  styleUrls: ['./formly-workflow.scss']
})
export class FormlyWorkflowComponent extends FieldType<FieldTypeConfig> implements OnInit {

  filteredOptions: Observable<string[]>;

  constructor(
    private generalService: GeneralService,
    private workflowService: WorkflowService) {

    super();
  }

  ngOnInit() {

    // Retrieving all workflows from backend.
    this.generalService.showLoading();
    this.workflowService.getWorkflows().subscribe({

      next: (result: string[]) => {

        this.generalService.hideLoading();
        for (const idx of result || []) {
          (<any[]>this.field.props.options).push({
            value: idx,
            label: idx,
            complete: true,
          });
        }
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });

    this.filteredOptions = this.formControl.valueChanges.pipe(
      startWith(this.model[<string>this.field.key]),
      map(value => this._filter(value || '')),
    );
    this.formControl.setValue(this.field.model[<string>this.field.key]);
    this.formControl.valueChanges.subscribe((val: string) => {
      this.model[<string>this.field.key] = val;
    });
  }

  optionSelected(e: MatAutocompleteActivatedEvent) {

    // Verifying this is a filename reference.
    this.generalService.showLoading();
    if (e.option.value.startsWith('/') && e.option.value.endsWith('.hl')) {

      // Retrieving arguments workflow file can handle.
      this.workflowService.getArgumentsForFile(e.option.value).subscribe({

        next: (result: any) => {

          this.generalService.hideLoading();
          this.props.change.call(this, result);
        },

        error: (error: any) => {

          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          this.generalService.hideLoading();
        }
      });
    }
  }

  /*
   * Private helper methods.
   */

  private _filter(value: string): any[] {

    if (!value) {
      return <any[]>this.field.props.options;
    }

    const filterValue = value.toLowerCase();
    return (<any[]>this.field.props.options).filter(option => option.label.toLowerCase().includes(filterValue));
  }
}
