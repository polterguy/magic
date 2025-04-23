
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

    let argumentsField: any = null;
    if (this.data.is_action) {
      this.fields.push({
        key: 'action_name',
        type: 'input',
        className: 'w-100 standalone-field',
        props: {
          placeholder: 'Action name ...',
          label: 'Name of Action',
          required: true,
        }
      });
      this.model.action_name = this.data.name;
    }

    // Adding fields as returned from server.
    for (const idx in this.data.input) {
      const field: FormlyFieldConfig = {

        // Because Formly turns 'foo.bar' into a nested object in model, we need this little hack around
        key: this.replaceAll(idx, '.', '$__$'),
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
          add = true;
          field.type = 'key-value';
          if (idx === 'arguments') {
            argumentsField = field;
          }
          field.props.options = [];
          if (!this.data.input[idx].noCandidates || this.data.input[idx].noCandidates === false) {
            for (const idxCandidate of this.data.candidates) {
              field.props.options.push({
                value: idxCandidate.value,
                label: idxCandidate.label,
                complete: idxCandidate.complete,
              });
            }
          }
          break;

        case 'array':
          add = true;
          field.type = 'array';
          field.props.options = [];
          if (!this.data.input[idx].noCandidates || this.data.input[idx].noCandidates === false) {
            for (const idxCandidate of this.data.candidates) {
              field.props.options.push({
                value: idxCandidate.value,
                label: idxCandidate.label,
                complete: idxCandidate.complete,
              });
            }
          }
          break;

        case 'int':
        case 'decimal':
        case 'float':
        case 'double':
        case 'long':
        case 'email':
        case 'string':
        case 'enum':
        case 'textarea':
        case 'action':
        case 'workflow':
        case '*':

          add = true;

          switch (this.data.input[idx].type) {

            case 'textarea':
              field.type = 'autocomplete-textarea';
              break;

            case '*':
              field.type = 'autocomplete';
              break;

            case 'workflow':
              field.type = 'workflow';
              break;

            case 'action':
              field.type = 'action';
              break;

            default:
              field.type = 'autocomplete';
          }

          field.props.options = [];
          if (this.data.input[idx].type === 'enum') {
            for (let idxNo = 0; idxNo < this.data.input[idx].values.length; idxNo++) {
              if (field.props.options.filter(x => x.value === this.data.input[idx].values[idxNo]).length === 0) {
                field.props.options.push({
                  value: this.data.input[idx].values[idxNo],
                  label: this.data.input[idx].values[idxNo],
                  complete: true,
                });
              }
            }
          }
          if (!this.data.input[idx].noCandidates || this.data.input[idx].noCandidates === false) {
            for (const idxCandidate of this.data.candidates) {
              field.props.options.push({
                value: idxCandidate.value + (this.data.input[idx].type === '*' && !idxCandidate.value.endsWith('*') ? '/*' : ''),
                label: idxCandidate.label + (this.data.input[idx].type === '*' && !idxCandidate.value.endsWith('*') ? '/*' : ''),
                complete: idxCandidate.complete + (this.data.input[idx].type === '*' && !idxCandidate.value.endsWith('*') ? '/*' : ''),
              });
            }
          }
          if (field.type === 'workflow') {
            field.props.change = (args: any) => {
              if (argumentsField) {
                this.model.arguments = {};
                for (const idx in args) {
                  this.model.arguments[idx] = 'CHANGE-THIS';
                }
                argumentsField.options.detectChanges();
              }
            };
          }
          if (field.type === 'action') {
            field.props.change = (args: any) => {
              if (argumentsField) {
                this.model.arguments = {};
                for (const idx in args) {
                  this.model.arguments[idx] = 'CHANGE-THIS';
                }
                argumentsField.options.detectChanges();
              }
            };
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
        if (this.data.model && this.data.model[idx]) {
          this.model[idx] = this.data.model[idx];
        } else if (this.data.input[idx].default) {
          this.model[idx] = this.data.input[idx].default;
        } else if (field.props.options && (<any[]>field.props.options).length > 0) {
          for (const idxOpt of <any[]>field.props.options) {
            if (idxOpt.value.endsWith('/' + idx)) {
              this.model[idx] = idxOpt.value;
            } else if (this.data.input[idx].type === '*' && idxOpt.value.endsWith('/' + idx + '/*')) {
              this.model[idx] = idxOpt.value;
            }
          }
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
          title: `Action might be invalid`,
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
      } else if (Object.prototype.toString.call(model[idx]) === '[object Array]') {
        result[idx] = model[idx];
      } else if (typeof model[idx] === 'boolean') {
        result[idx] = model[idx];
      } else if (typeof model[idx] === 'number') {
        result[idx] = model[idx];
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
