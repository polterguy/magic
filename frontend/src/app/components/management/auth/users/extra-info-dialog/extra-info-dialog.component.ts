import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User_Extra } from '../../models/user.model';

import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators
} from '@angular/forms';
import { UserService } from '../../services/user.service';
import { FeedbackService } from 'src/app/services/feedback.service';

@Component({
  selector: 'app-extra-info-dialog',
  templateUrl: './extra-info-dialog.component.html',
  styleUrls: ['./extra-info-dialog.component.scss']
})
export class ExtraInfoDialogComponent implements OnInit {
  @ViewChild('newInput') newInput: ElementRef;
  /**
   * To specify if new fields are to be added,
   * returns to true is add new button is clicked
   */
  public fieldsToBeAdded: boolean = false;

  /**
   * To get the new fields type and value
   */
  public tempType: string;
  public tempValue: string;
  private newFields: User_Extra[] = [];

  /**
   * 
   * @param dialogRef To access the referece of the dialog
   * @param data The data passed to this component from the parent
   * @param fb Form Builder
   * @param userService User service to access the endpoints
   * @param feedbackService To show feedback after invokation
   * @param cdr To detect changes - used only inside the createNewFields to check for changes in ngIf
   */
  constructor(
    private dialogRef: MatDialogRef<ExtraInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { extra: User_Extra[], action: string },
    private fb: FormBuilder,
    private userService: UserService,
    private feedbackService: FeedbackService,
    private cdr: ChangeDetectorRef) { }

  /**
   * initialization of our dynamic form
   */
  public extraInfoForm = this.fb.group({});

  ngOnInit(): void {
    this.setFormFields();
  }

  /**
   * Sets dynamic fields based on the existing data.
   * Sets all fields to disable, if the action is not equal to 'edit'
   */
  setFormFields() {
    this.data.extra.forEach(element => {
      this.extraInfoForm.setControl(element.type, new FormControl(element.value));
      this.data?.action !== 'edit' ? this.extraInfoForm.disable() : '';
    });
  }

  /**
   * Stores the newly added fields.
   * Updates the original array of data.
   * Creates a new array containing only newly added fields
   */
  saveNewFields() {
    this.extraInfoForm.setControl(this.tempType, new FormControl(this.tempValue));
    this.data.extra.push({
      user: this.data.extra[0].user,
      type: this.tempType,
      value: this.tempValue,
      new: true
    });
    this.newFields.push({
      user: this.data.extra[0].user,
      type: this.tempType,
      value: this.tempValue
    });
    this.tempType = '';
    this.tempValue = '';
    this.fieldsToBeAdded = false;
    this.extraInfoForm.disable();
  }

  /**
   * Removes the newly added field, if clicked.
   * Updates both original array of data and the array containing new fields
   */
  removeNewField(field: User_Extra) {
    this.extraInfoForm.removeControl(field.type);
    this.data.extra = this.data.extra.filter(x => x.type !== field.type);
    this.newFields = this.newFields.filter(x => x.type !== field.type);
  }

  /**
   * To show dynamic fields for receiving new  information.
   * Sets focus on the field
   */
  createNewFields(){
    this.fieldsToBeAdded = true;
    this.cdr.detectChanges();
    this.newInput.nativeElement.focus();
  }
  /**
   * Toggles the extra details view for a single user.
   * @callback close To close the dialog and update the list of users
   */
  editExtra() {
    // To temporary store only changed fields
    const changedFields: any = [];
    // Iterating over dynamic fields in the form
    for (let key in this.extraInfoForm.value) {
      let value = this.extraInfoForm.value[key];

      // Finding the fields that have been changed compared to the original data
      this.data.extra.forEach(element => {
        if (element.type === key && element.value !== value) {
          changedFields.push({
            user: this.data.extra[0].user,
            type: key,
            value: value
          })
        }
      });

      // Invoking the endpoint per changed field,
      // and close the dialog when iteration is over.
      changedFields.forEach((element: User_Extra, index: number) => {
        this.userService.editExtra(element).subscribe({
          next: (res: any) => {
            if (index === changedFields.length - 1) {
              this.feedbackService.showInfo('Fields successfully updated');
              this.close();
            }
          },
          error: (error: any) => this.feedbackService.showError(error)
        });
      })
    }

    // Displaying feedback if no field has been changed
    if (changedFields.length === 0) {
      this.feedbackService.showInfo('No changes detected.')
    }
  }

  /**
   * Adds new fields to the user's extra information.
   * @callback close To close the dialog and update the users' list
   */
  addExtra() {
    if (this.newFields.length > 0) {
        this.newFields.forEach((element: any, index: number) => {
          this.userService.addExtra({
            user: this.data.extra[0].user,
            type: element.type,
            value: element.value
          }).subscribe({
            next: (res: any) => {
              if (index === this.newFields.length - 1) {
                this.feedbackService.showInfo('New field successfully added');
                this.close();
              }
            },
            error: (error: any) => this.feedbackService.showError(error)
          });
        })
    } else {
      this.feedbackService.showInfo('Please add new fields to save.')
    }
  }

  /**
   * Deletes the selected field in extra details of the user.
   * 
   * @param username User to delete extra details for
   * @param type Type of the field to be deleted
   */
  deleteExtra(type: string, username: string) {
    this.userService.deleteExtra(type, username).subscribe({
      next: (res: any) => {

        this.feedbackService.showInfo(type + ' is successfully deleted');
        this.extraInfoForm.removeControl(type);
        this.data.extra = this.data.extra.filter(x => x.type !== type);
        if (this.data.extra.length === 0) {
          this.close();
        }
      },
      error: (error: any) => this.feedbackService.showError(error)
    });
  }

  /**
   * Closes the dialog and sends a message to the parent component,
   * so the user's list will be updated.
   */
  close() {
    this.dialogRef.close('updated');
  }
}
