
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FormGroup } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Utility imports
import { FormlyFieldConfig } from '@ngx-formly/core';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Modal dialog allowing you to parametrise and execute a macro.
 */
@Component({
  selector: 'app-parametrise-action-dialog',
  templateUrl: './parametrise-action-dialog.component.html',
  styleUrls: ['./parametrise-action-dialog.component.scss']
})
export class ParametriseActionDialog implements OnInit {

  form = new FormGroup({});
  fields: FormlyFieldConfig[] = [];
  model: any = {};

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private refDialog: MatDialogRef<ParametriseActionDialog>) {}

  ngOnInit() {

    for (const idx in this.data.input) {
      const field: FormlyFieldConfig = {
        key: idx,
        className: 'w-100 standalone-field',
        props: {
          placeholder: idx,
          label: idx,
        }
      };

      if (this.data.input[idx].mandatory) {
        field.props.required = true;
      }

      let add = false;
      switch (this.data.input[idx].type) {

        case 'key-value':
          break;

        case 'string':
          add = true;
          field.type = 'input';
          field.props.attributes = {
            autocomplete: 'off',
          };
          break;

        case 'textarea':
          add = true;
          field.type = 'textarea';
          field.props.attributes = {
            rows: 5,
          };
          break;

        case 'sql':
          add = true;
          field.type = 'sql';
          break;

        case 'email':
          add = true;
          field.type = 'input';
          field.props.attributes = {
            autocomplete: 'email',
          };
          break;

        case 'enum':
          add = true;
          field.type = 'select';
          field.props.options = [];
          for (let idxNo = 0; idxNo < this.data.input[idx].values.length; idxNo++) {
            field.props.options.push({
              value: this.data.input[idx].values[idxNo],
              label: this.data.input[idx].values[idxNo],
            });
          }
          break;

        default:
          field.type = 'input';
          break;
      }
      if (add) {
        this.fields.push(field);
        if (this.data.input[idx].default) {
          this.model[idx] = this.data.input[idx].default;
        }
      }
    }
  }

  onSubmit(model: any) {

    if (!this.form.valid) {

      this.generalService.showFeedback('Input is not valid', 'errorMessage');
      return;
    }
    this.refDialog.close(model);
  }
}
