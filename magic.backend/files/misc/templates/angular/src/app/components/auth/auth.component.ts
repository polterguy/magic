
import { Component, OnInit } from '@angular/core';
import { AuthService, AuthFilter } from 'src/app/auth-service';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  private userColumns: string[] = ['username', 'delete'];
  private roleColumns: string[] = ['name', 'delete'];
  private users: any[] = null;
  private roles: any[] = null;
  private userCount: number = 0;
  private roleCount: number = 0;
  private userFilter: AuthFilter = {
    limit: 10,
    offset: 0,
  };
  private roleFilter: AuthFilter = {
    limit: 10,
    offset: 0,
  };

  constructor(
    private service: AuthService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getUsers();
    this.getRoles();
    this.service.getUsersCount().subscribe(res => {
      this.userCount = res.count;
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  this.service.getRolesCount().subscribe(res => {
      this.roleCount = res.count;
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getUsers() {
    this.service.getUsers(this.userFilter).subscribe(res => {
      this.users = res;
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getRoles() {
    this.service.getRoles(this.roleFilter).subscribe(res => {
      this.roles = res;
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  createNewRole() {
    
  }

  deleteUser() {
    alert('todo');
  }

  deleteRole() {
    alert('todo');
  }

  usersPaged(e: PageEvent) {
    this.userFilter.limit = e.pageSize;
    this.userFilter.offset = e.pageSize * e.pageIndex;
    this.getUsers();
  }

  rolesPaged(e: PageEvent) {
    this.roleFilter.limit = e.pageSize;
    this.roleFilter.offset = e.pageSize * e.pageIndex;
    this.getRoles();
  }
}
