
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelectChange } from '@angular/material';
import { CrudifyService } from 'src/app/services/crudify-service';

export interface DialogData {
  filename: string;
}

@Component({
  templateUrl: 'get-save-filename.html',
})
export class GetSaveFilenameDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<GetSaveFilenameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  close() {
    this.dialogRef.close();
  }
}
