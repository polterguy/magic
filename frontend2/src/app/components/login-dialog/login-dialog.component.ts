import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  public username: string;
  public password: string;

  constructor(
    private authService: AuthService,
    public dialogRef: MatDialogRef<LoginDialogComponent>) { }

  ngOnInit() {
  }

  login() {
    this.authService.authenticate(
      this.authService.backendUrl,
      this.username,
      this.password,
      false).subscribe(res => {
      console.log(res);
    });
    this.dialogRef.close();
  }
}
