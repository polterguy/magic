
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KeysService } from 'src/app/services/keys-service';

export interface ImportKeyDialogData {
  id?: number;
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
export class ImportKeyDialogComponent implements OnInit {

  constructor(
    private keysService: KeysService,
    public dialogRef: MatDialogRef<ImportKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportKeyDialogData) {}

  ngOnInit() {
    if (this.data.url.startsWith('http://')) {
      this.data.url = this.data.url.substr(7);
    } else {
      this.data.url = this.data.url.substr(8);
    }
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
