
import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users-service';

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

  constructor(private usersService: UsersService) { }

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
      console.log(this.selectedUserRoles);
    });
  }
}
