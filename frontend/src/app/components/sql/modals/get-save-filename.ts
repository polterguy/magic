
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelectChange } from '@angular/material';

export interface DialogData {
  filename: string;
  existingFiles: string[];
}

@Component({
  templateUrl: 'get-save-filename.html',
})
export class GetSaveFilenameDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<GetSaveFilenameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  selectedFileChanged(e: MatSelectChange) {
    const strValue = e.value as string;
    this.data.filename =  strValue.substr(0, strValue.length - 4);
  }

  close() {
    this.dialogRef.close();
  }
}
