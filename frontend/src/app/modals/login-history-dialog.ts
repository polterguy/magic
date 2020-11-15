
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface LoginHistoryDialogData {
  url: string;
}

@Component({
  templateUrl: 'login-history-dialog.html',
  styleUrls: ['login-history-dialog.scss']
})
export class LoginHistoryDialogComponent implements OnInit {

  public urls: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<LoginHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LoginHistoryDialogData) { }

  ngOnInit() {
    const data = localStorage.getItem('urls');
    if (data) {
      this.urls = JSON.parse(data);
    }
  }

  close() {
    this.dialogRef.close();
  }

  closeOk(url: string) {
    this.dialogRef.close({
      url: url,
    });
  }
}
