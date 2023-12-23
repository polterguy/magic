
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FormGroup } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

// Utility imports
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ConfirmationDialogComponent } from 'src/app/components/protected/common/confirmation-dialog/confirmation-dialog.component';

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
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private refDialog: MatDialogRef<ParametriseActionDialog>) { }

  ngOnInit() {

    // Adding fields as returned from server.
    for (const idx in this.data.input) {
      const field: FormlyFieldConfig = {

        // Because Formly turns 'foo.bar' into a nested object in model, we need this little hack around
        key: this.replaceAll(idx, '.', '$__$'),
        className: 'w-100 standalone-field',
        options: {

        },
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
          add = true;
          field.type = 'key-value';
          field.props.options = [];
          for (const idxCandidate of this.data.candidates) {
            field.props.options.push({
              value: ':x:' + idxCandidate.expression,
              label: ':x:' + idxCandidate.expression,
            });
          }
          break;

        case 'array':
          add = true;
          field.type = 'array';
          break;

        case 'int':
        case 'long':
        case 'email':
        case 'string':
        case 'enum':
        case 'textarea':
          add = true;
          field.type = this.data.input[idx].type === 'textarea' ? 'autocomplete-textarea' : 'autocomplete';
          field.props.options = [];
          if (this.data.input[idx].type === 'enum') {
            for (let idxNo = 0; idxNo < this.data.input[idx].values.length; idxNo++) {
              if (field.props.options.filter(x => x.value === this.data.input[idx].values[idxNo]).length === 0) {
                field.props.options.push({
                  value: this.data.input[idx].values[idxNo],
                  label: this.data.input[idx].values[idxNo],
                });
              }
            }
          }
          for (const idxCandidate of this.data.candidates) {
            field.props.options.push({
              value: ':x:' + idxCandidate.expression,
              label: ':x:' + idxCandidate.expression,
            });
          }
          break;

        case 'sql':
          add = true;
          field.type = 'sql';
          break;

        case 'csharp':
          add = true;
          field.type = 'csharp';
          break;

        case 'hyperlambda':
          add = true;
          field.type = 'hyperlambda';
          break;

        case 'bool':
          add = true;
          field.type = 'checkbox';
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

    /*
     * Notice, we still allow for saving the action if it's got errors,
     * since it might be valid in the context it's supposed to run in.
     */
    if (!this.form.valid) {

      // Asking user to confirm saving action with error.
      this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Action is not valid`,
          description: `Action\'s arguments cannot be verified, are you sure you want to save it?`,
          action_btn: 'Yes',
          close_btn: 'No',
          action_btn_color: 'warn',
        }
      }).afterClosed().subscribe((result: string) => {

        if (result === 'confirm') {
          this.refDialog.close(this.getModel(model));
        }
      });

    } else {

      this.refDialog.close(this.getModel(model));
    }
  }

  /*
   * Private helper methods
   */

  // Reverts '$__$' in field names back to '.', and verifies we only submit non-empty values
  private getModel(model: any) {

    const result: any = {};
    for (var idx in model) {
      if (typeof model[idx] === 'string') {
        if (model[idx] !== '') {
          result[this.replaceAll(idx, '$__$', '.')] = model[idx];
        }
      } else {
        result[idx] = this.getModel(model[idx]);
      }
    }
    return result;
  }

  // "Replace all" helper
  private replaceAll(str: string, find: string, replace: string) {

    return str.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
  }
}
