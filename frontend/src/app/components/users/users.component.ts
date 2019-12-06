
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
  public users: any[];

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

  filterChanged() {
    this.getUsers();
  }
}
