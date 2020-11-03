
import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users-service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewUserDialogComponent } from './modals/new-user-dialog';
import { AddRoleDialogComponent } from './modals/add-role-dialog';

@Component({
  selector: 'app-roles',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  public filter = '';
  public displayedColumns: string[] = ['username', 'delete'];
  public displayedColumnsRoles: string[] = ['role', 'delete'];
  public users: any[] = null;
  public selectedUser: string = null;
  public selectedUserRoles: any[] = null;
  public validAuthEndpoints = false;

  constructor(
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.getUsers();
  }

  getUsers() {
    this.selectedUser = null;
    this.selectedUserRoles = null;
    this.usersService.list(this.filter).subscribe(res => {
      this.validAuthEndpoints = true;
      this.users = res;
    }, err => {
      this.validAuthEndpoints = false;
      if (err.status === 404) {
        this.showError('You need to crudify your authentication database');
      } else {
        this.showError(err.error.message);
      }
    });
  }

  dataSource() {
    return this.users;
  }

  getUserCssClass(user: any) {
    if (user.username === this.selectedUser) {
      return 'mat-row selected';
    }
    return 'mat-row';
  }

  filterChanged() {
    this.getUsers();
    this.selectedUser = null;
    this.selectedUserRoles = null;
  }

  selectUser(username: string) {
    this.selectedUser = username;
    this.getUserRoles();
  }

  getUserRoles() {
    this.usersService.getRoles(this.selectedUser).subscribe(res => {
      this.selectedUserRoles = res || [];
    });
  }

  createUser() {
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '500px',
      data: {
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        console.log(res);
        this.usersService.createUser(res.username, res.password).subscribe(res2 => {
          this.showInfo('User was successfully created');
          this.getUsers();
          this.selectUser(res.username);
        }, error => {
          this.showError(error.error.message);
        });
      }
    });
  }

  deleteUser(username: string) {
    this.usersService.deleteUser(username).subscribe(res => {
      this.showInfo('User was successfully deleted');
      this.getUsers();
    });
  }

  addRole() {
    const dialogRef = this.dialog.open(AddRoleDialogComponent, {
      width: '500px',
      data: {
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        this.usersService.addRoleToUser(this.selectedUser, res).subscribe(res2 => {
          this.showInfo('Role successfully added to user');
          this.getUserRoles();
        }, error => {
          this.showError(error.error.message);
        });
      }
    });
  }

  deleteRoleFromUser(role: string) {
    this.usersService.deleteRoleFromUser(this.selectedUser, role).subscribe(res => {
      this.showInfo('Role successfully deleted');
      this.getUserRoles();
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showInfo(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['info-snackbar'],
    });
  }
}
