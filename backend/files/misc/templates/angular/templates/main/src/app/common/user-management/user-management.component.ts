
// Angular specific imports
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@app/services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Extra, Role, Roles, User, UsersService } from '@app/services/users-service';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ConfirmDialogComponent } from '@app/confirm-deletion-dialog/confirm-dialog.component';

/**
 * Users component allowing an administrator to create, read, update and delete users in the system.
 */
@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', opacity: '0'})),
      state('expanded', style({height: '*', opacity: '1'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class UserManagementComponent implements OnInit {

  /**
   * Which columns we should display. Reorder to prioritize columns differently.
   * Notice! 'delete-instance' should always come last.
   */
  public displayedColumns: string[] = [
    'username',
    'created',
    'delete-instance'
  ];

  /**
   * What element is currently expanded.
   */
  public expandedElement: User | null;

  /**
   * Need to view paginator as a child to update page index of it.
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /**
   * Form control declarations to bind up with users filtering control.
   */
  public username: FormControl;

  /**
   * Temporary stores the username's search keyword
   */
  private usernameSearchKey: string = '';

  /**
   * Currently viewed users.
   */
  public users: User[] = null;

  /**
   * How many users to view simultaneously.
   */
  public pageSize: number = 25;

  /**
   * Specifies the page that is currently displaying. 
   */
  public currentPage: number = 0;

  /**
   * Total number of records.
   */
  public total: number = 0;

  /**
   * Stores the list of all available roles.
   */
  private roles: any = [];

  // MatPaginator Output
  pageEvent!: PageEvent;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog To show confirmation dialog before deleting a record.
   * @param snackBar To show feedback to the users.
   * @param usersService Needed to be able to retrieve users from backend
   * @param authService Needed to determine if user has access to operations on users
   * @param cdr To detect the changes.
   */
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private usersService: UsersService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Retrieves initial users
    this.getData();

    // Fetches the total number of users
    this.getUsersCount();

    /*
     * Creating our filtering FormControl instances, which gives us "live filtering"
     * on our columns.
     */
    this.username = new FormControl('');
    this.username.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        if (query.length > 2) {
          this.usernameSearchKey = query.trim();
          this.currentPage = 0;
          this.paginator.pageIndex = 0;
          this.getData();
          this.getUsersCount();
        } 
        if (query.length === 0) {
          this.usernameSearchKey = '';
          this.getData();
          this.getUsersCount();
        }
      });
  }

  /**
   * Clears the search input resets the value of username.
   * @callback getUsersCount To get the total number of users.
   * @callback getData To get the full list of users.
   */
  public clearSearch() {
    this.usernameSearchKey = '';
    this.username.setValue(''); 
    this.getData();
    this.getUsersCount();
  }

  /**
   * Invoked when paging occurs.
   */
  paged(event: PageEvent) {
    this.pageEvent = event;
    this.currentPage = event.pageIndex;
    this.pageSize = this.pageEvent.pageSize;
    this.getData();
  }

  /*
   * Responsible for retrieving items from backend.
   * Sets two new keys to each record, as role and extra to be filled upon request.
   */
  private getData() {
    const params: string = `?limit=${this.pageSize}&offset=${this.currentPage * this.pageSize}` +
    `${this.usernameSearchKey !== '' ? `&username.like=%${encodeURIComponent(this.usernameSearchKey)}%` : ''}`;
    this.usersService.users(params).subscribe({
      next: (users: User[]) => {
        users = users || [];
        users.map((user: User) => { user.role = []; user.extra = [] });
        this.users = users;
        this.usernameSearchKey = '';
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  /**
   * Retrieves roles assigned to the selected user.
   * Will be called only once, if the role item is empty.
   * @param username The selected user's username.
   * @param role The selected user's roles.
   * @callback getUserExtras To fetch the user's extra details.
   */
  public getUserRoles(username: string, role: any) {
    if (role.length === 0) {
      const params: string = `?user.eq=${username}`;
      this.usersService.getUserRole(params).subscribe({
        next: (res: Role[]) => {
          if (res) {
            let user: User = this.users.find((user: any) => user.username === username);
            user.role.push(...res.map((item: any) => { return item.role }));
            this.getUserExtras(username);
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.log(error);
        }
      })
    }
  }

  /**
   * Retrieves extra details for selected user.
   * Will be called only once.
   * @param username The selected user's username.
   */
  private getUserExtras(username: string) {
    const params: string = `?user.eq=${username}`;
    this.usersService.getUserExtras(params).subscribe({
      next: (res: Extra[]) => {
        if (res) {
          let user: any = this.users.find((user: any) => user.username === username);
          user.extra.push(...res);
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }

  /**
   * Gets the total number of users.
   */
  private getUsersCount() {
    const params: string = `${this.usernameSearchKey !== '' ? `?username.like=%${encodeURIComponent(this.usernameSearchKey)}%` : ''}`;
    this.usersService.usersCount(params).subscribe({
      next: (res: any) => {
        this.total = res.count;
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  /**
   * Gets the total number of users.
   * @callback getUsersCount To get the updated total number of users.
   * @callback getData To get the updated list of users.
   */
  public deleteUser(username: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: 'Confirm deletion',
        text: 'Are you sure?<br/>By proceeding the selected user will be deleted permanently.'
      }
    }).afterClosed().subscribe((result: any) => {
      if(result?.confirmed) {
        const params: string = `?username=${username}`
        this.usersService.deleteUser(params).subscribe({
          next: (res: any) => {
            if (res.affected > 0) {
              this.snackBar.open('The user is deleted successfully.', 'Close', {
                duration: 2000,
              });
              this.currentPage = 0;
              this.getData();
              this.getUsersCount();
            }
          },
          error: (error: any) => {
            console.log(error);
          }
        });
      }
    })
  }

  /**
   * Retrieves the list of roles in the system once, upon a request for editing details.
   * Stores in "roles" variable, which will be used only if the user decides to edit a user's roles.
   * @callback openEditDialog to open the dialog directly, if the user has roles.
   */
  private getRoles(user: User) {
    this.usersService.getRoles().subscribe({
      next: (res: Roles[]) => {
        this.roles = res || [];
        this.openEditDialog(user);
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  /**
   * Allows editing the selected user's role in a modal.
   * @param user All information related to the selected user.
   * @callback openEditDialog to open the dialog directly, if the user has roles.
   * @callback getRoles to get the user role, if the user's role is empty.
   */
  public edit(user: User) {
    if (this.roles.length > 0) {
      this.openEditDialog(user);
    } else {
      this.getRoles(user);
    }
  }
  
  /**
   * Opens a modal to allow user update the role for the selected record.
   * @param user The entire details of the selected user.
   */
  private openEditDialog(user: User) {
    this.dialog.open(EditUserDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        user: user,
        roles: this.roles
      }
    }).afterClosed().subscribe((res: {role: any, locked: boolean}) => {
      
      // Updating the selected user's detail without refetching data.
      this.users.find((item: User) => item.username === user.username).role = res.role;
      let lockState: number = undefined;
      res.locked ? lockState = 1 : lockState = 0;
      this.users.find((item: User) => item.username === user.username).locked = lockState;
    })
  }

  /**
   * Opens a modal to allow user create a new user on the system.
   * @callback getData To refetch the list of users upon creating a new one.
   */
  public createUser() {
    this.dialog.open(CreateUserDialogComponent, {
      width: '500px',
      disableClose: true
    }).afterClosed().subscribe((res: string) => {
      if (res === 'saved') {
        this.getData();
        this.getUsersCount();
      }
    })
  }
}
