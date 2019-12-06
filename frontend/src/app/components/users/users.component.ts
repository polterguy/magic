
import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users-service';
import { MatDialog } from '@angular/material';
import { NewUserDialogComponent } from './modals/new-user-dialog';

@Component({
  selector: 'app-home',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  private filter = '';
  public displayedColumns: string[] = ['username'];
  public displayedColumnsRoles: string[] = ['role'];
  public users: any[];
  private selectedUser: string = null;
  private selectedUserRoles: any[] = null;

  constructor(
    private usersService: UsersService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.getUsers();
  }

  getUsers() {
    this.usersService.list(this.filter).subscribe(res => {
      this.users = res;
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
    this.usersService.getRoles(username).subscribe(res => {
      this.selectedUserRoles = res;
    });
  }

  createUser() {
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '500px',
      data: {
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        this.usersService.createUser(res.username, res.password).subscribe(res =>{
          this.getUsers();
        });
      }
    });
  }
}
