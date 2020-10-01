import { Message, Messages, MessageService } from 'src/app/services/message-service';
import { AuthService, AuthFilter } from 'src/app/services/auth-service';
import { CreateRoleDialogComponent } from './modals/create-role-dialog';
import { CreateUserDialogComponent } from './modals/create-user-dialog';
import { EditUserDialogComponent } from './modals/edit-user-dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Authorization and authentication component, allowing an administrator
 * of the system to create/read/update/delete users and roles in the system.
 */
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {

  // Used to subscribe to events triggered by other parts of the system.
  private subscription: Subscription;

  // Columns for our user mat-table.
  public userColumns: string[] = ['username', 'delete'];

  // Columns ffor our roles mat-table.
  public roleColumns: string[] = ['name', 'delete'];

  // Users currently retrieved from backend.
  public users: any[] = null;

  // Roles currently retrieved from backend.
  public roles: any[] = null;

  // Number of users in the system in total.
  public userCount: number = 0;

  // Number of roles in the system in total.
  public roleCount: number = 0;

  // Search control, for filtering users.
  public search: FormControl;

  // Get conditions for users to retrieve from backend.
  public userFilter: AuthFilter = {
    limit: 10,
    offset: 0,
  };

  // Get conditions for roles to retrieve from backend.
  public roleFilter: AuthFilter = {
    limit: 10,
    offset: 0,
  };

  /**
   * Constructor creating our component.
   * 
   * @param messages Message service to use pub/sub to allow for cross component communication
   * @param service Auth service to use for retrieving and updating users/roles.
   * @param snackBar Used to report errors to user.
   * @param dialog Used for opening up modal dialogues, which are used when roles/users are being edited.
   */
  constructor(
    private messages: MessageService,
    private service: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Getting users, making sure we count them afterwards.
    this.getUsers(() => this.getUsersCount());

    // Getting roles, making sure we count them afterwards.
    this.getRoles(() => this.getRolesCount());

    // Creating our filter/search users control.
    this.search = new FormControl('');
    this.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {

        // Filter was changed, re-retrieving users from backend, and re-databinding grid.
        this.userFilter.filter = query;
        this.getUsers();
      });

    /*
     * Creating our subscription, which once asked for stuff, will
     * return it back to the whomever is requesting it.
     */
    this.subscription = this.messages.subscriber().subscribe((msg: Message) => {

      switch (msg.name) {

        case Messages.LOGGED_IN:
          this.getUsers(() => this.getUsersCount());
          this.getRoles(() => this.getRolesCount());
          break;

        case Messages.LOGGED_OUT:
          this.roles = [];
          this.users = [];
          this.roleCount = 0;
          this.userCount = 0;
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Creates a new role in the system.
   */
  public createNewRole() {
    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      data: {
        name: '',
        description: '',
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {
        this.getRoles(() => {
          this.snackBar.open('Role was successfully created', 'Close', {
            duration: 2000
          });
          this.getRolesCount();
        });
      }
    });
  }

  /**
   * Creates a new user in the system.
   */
  public createNewUser() {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      data: {
        name: '',
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {
        this.getUsers(() => {
          this.snackBar.open('User was successfully created', 'Close', {
            duration: 2000
          });
          this.getUsersCount();
        });
      }
    });
  }

  /**
   * Deletes the specified user from the system.
   * 
   * @param username Username of user to delete
   */
  public deleteUser(username: string) {
    this.service.deleteUser(username).subscribe(res => {
      this.getUsers(() => {
        this.snackBar.open('User was succesfully deleted', 'Close', {
          duration: 2000,
        });
      });
      this.getUsersCount();
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  /**
   * Deletes the specified roles from the system.
   * 
   * @param name Name of role to delete
   */
  public deleteRole(name: string) {
    this.service.deleteRole(name).subscribe(res => {
      this.getRoles(() => {
        this.snackBar.open('Role was succesfully deleted', 'Close', {
          duration: 2000,
        });
      });
      this.getRolesCount();
    }, (error: any) => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  /**
   * Invoked when the users table is being paged.
   * 
   * @param e Pager event object
   */
  public usersPaged(e: PageEvent) {
    this.userFilter.limit = e.pageSize;
    this.userFilter.offset = e.pageSize * e.pageIndex;
    this.getUsers();
  }

  /**
   * Invoked when the roles table is being paged.
   * 
   * @param e Pager event object.
   */
  public rolesPaged(e: PageEvent) {
    this.roleFilter.limit = e.pageSize;
    this.roleFilter.offset = e.pageSize * e.pageIndex;
    this.getRoles();
  }

  /**
   * Invoked when the client wants to edit a user.
   * 
   * @param username Username of user to edit
   */
  public editUser(username: string) {
    if (username === 'root') {
      this.snackBar.open('Root user cannot be edited!', 'Close', {
        duration: 2000,
        panelClass: ['error-snackbar'],
      });
      return;
    }
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: {
        username,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {
        console.log('User successfully updated');
      }
    });
  }

  // Retrieves users from backend.
  private getUsers(callback: Function = null) {
    this.service.getUsers(this.userFilter).subscribe(res => {
      this.users = res;
      if (callback !== null) {
        callback(); // Invoking callback specified by caller.
      }
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  // Retrieves roles from backend.
  private getRoles(callback: Function = null) {
    this.service.getRoles(this.roleFilter).subscribe(res => {
      this.roles = res;
      if (callback !== null) {
        callback();
      }
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  // Retrieves the total numbers of users in the system.
  private getUsersCount() {
    this.service.getUsersCount().subscribe((res: any) => {
      this.userCount = res.count;
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  // Retrieves the total numbers of roles in the system.
  private getRolesCount() {
    this.service.getRolesCount().subscribe((res: any) => {
      this.roleCount = res.count;
    }, error => {
      this.snackBar.open(error.error.message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }
}
