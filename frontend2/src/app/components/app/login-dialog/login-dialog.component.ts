
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

/**
 * Login dialog allowing user to login to one or more backends.
 */
@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  public backends: FormControl = null;
  public filteredBackends: Observable<string[]>;
  public username: string;
  public password: string;
  public savePassword: boolean = false;

  constructor(
    public authService: AuthService,
    public dialogRef: MatDialogRef<LoginDialogComponent>) { }

  ngOnInit() {
    this.backends = new FormControl();
    this.filteredBackends = this.backends.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filter(value))
      );
  }

  public backendChosen() {
    const el = this.authService.backends.filter(x => x.url === this.backends.value);
    if (el.length > 0) {
      this.username = el[0].username;
      this.password = el[0].password;
      this.savePassword = !!el[0].password && this.password !== 'root';
    }
  }

  public login() {
    this.authService.login(
      this.backends.value,
      this.username,
      this.password,
      this.savePassword).subscribe(res => {
        this.dialogRef.close();
      }, error => {
        console.error(error);
      });
  }

  private filter(value: string) {
    return this.authService.backends
      .filter(x => x.url.includes(value))
      .map(x => x.url);
  }
}
