
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KeysService } from 'src/app/services/keys-service';

export interface ImportKeyDialogData {
  id?: number;
  imported?: Date;
  subject: string;
  domain: string;
  email: string;
  content: string;
  fingerprint: string;
  type: string;
}

@Component({
  templateUrl: 'import-key-dialog.html',
  styleUrls: ['import-key-dialog.scss']
})
export class ImportKeyDialogComponent {

  constructor(
    private keysService: KeysService,
    public dialogRef: MatDialogRef<ImportKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportKeyDialogData) {}

  getDate(date: any) {
    return new Date(date).toLocaleString();
  }

  close(): void {
    this.dialogRef.close();
  }

  keyChanged() {
    if (this.data.content === '') {
      this.data.fingerprint = '';
      return;
    }
    this.keysService.getFingerprint(this.data.content).subscribe(res => {
      this.data.fingerprint = res.fingerprint;
    });
  }
}
