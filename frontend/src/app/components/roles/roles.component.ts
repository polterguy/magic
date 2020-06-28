
import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users-service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { NewRoleDialogComponent } from './modals/new-role-dialog';

@Component({
  selector: 'app-home',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  public filter = '';
  public displayedColumns: string[] = ['name', 'description', 'delete'];
  public roles: any[] = null;
  public validAuthEndpoints = false;

  constructor(
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.getRoles();
  }

  getRoles() {
    this.usersService.listRoles(this.filter).subscribe(res => {
      this.validAuthEndpoints = true;
      this.roles = res;
    }, err => {
      this.validAuthEndpoints = false;
      if (err.status === 404) {
        this.showError('You need to crudify your authentication database');
      } else {
        this.showError(err.error.message);
      }
    });
  }

  filterChanged() {
    this.getRoles();
  }

  createRole() {
    const dialogRef = this.dialog.open(NewRoleDialogComponent, {
      width: '500px',
      data: {
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        this.usersService.createRole(res.name, res.description).subscribe(res2 => {
          this.showInfo('Role was successfully created');
          this.getRoles();
        }, error => {
          this.showError(error.error.message);
        });
      }
    });
  }

  deleteRole(name: string) {
    this.usersService.deleteRole(name).subscribe(res => {
      this.showInfo('Role was successfully deleted');
      this.getRoles();
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
