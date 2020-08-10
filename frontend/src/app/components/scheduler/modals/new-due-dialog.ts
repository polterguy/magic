
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface NewDueDialogData {
  due?: Date;
  repeats?: string;
}

@Component({
  selector: 'new-due-dialog',
  templateUrl: 'new-due-dialog.html',
  styleUrls: ['new-due-dialog.scss']
})
export class NewDueDialog {

  public due: Date = null;
  public repetition: string = '**.**.**.**.**.**';
  public schedule = "once";

  constructor(
    public dialogRef: MatDialogRef<NewDueDialog>,
    @Inject(MAT_DIALOG_DATA) public data: NewDueDialogData) {
  }

  typeChanged(e: any) {
    this.schedule = e.value;
  }

  saveTask() {
    if (this.schedule === 'once') {
      delete this.data.repeats;
      this.data.due = this.due;
    } else {
      delete this.data.due;
      this.data.repeats = this.repetition;
    }
    this.dialogRef.close(this.data);
  }

  close() {
    this.dialogRef.close();
  }
}
