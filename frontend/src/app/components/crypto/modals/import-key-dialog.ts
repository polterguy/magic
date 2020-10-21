
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KeysService } from 'src/app/services/keys-service';

export interface ImportKeyDialogData {
  subject: string;
  url: string;
  email: string;
  content: string;
  fingerprint: string;
  type: string;
}

@Component({
  templateUrl: 'import-key-dialog.html',
})
export class ImportKeyDialogComponent {

  constructor(
    private keysService: KeysService,
    public dialogRef: MatDialogRef<ImportKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportKeyDialogData) {}

  close(): void {
    this.dialogRef.close();
  }

  keyChanged() {
    this.keysService.getFingerprint(this.data.content).subscribe(res => {
      this.data.fingerprint = res.fingerprint;
    });
  }
}
