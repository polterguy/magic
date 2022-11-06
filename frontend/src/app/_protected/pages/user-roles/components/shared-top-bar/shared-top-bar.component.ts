import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, ReplaySubject, debounceTime } from 'rxjs';
import { Role } from '../../_models/role.model';
import { ManageRoleDialogComponent } from '../manage-role-dialog/manage-role-dialog.component';
import { NewUserDialogComponent } from '../new-user-dialog/new-user-dialog.component';

@Component({
  selector: 'app-shared-top-bar',
  templateUrl: './shared-top-bar.component.html',
  styleUrls: ['./shared-top-bar.component.scss']
})
export class SharedTopBarComponent implements OnInit {

  @Input() tab: string = 'user';
  @Input() rolesList: Role[] = [];
  @Input() accessPermissions: any = [];

  @Output() getUsersList = new EventEmitter<any>();
  @Output() getRolesList = new EventEmitter<any>();

  /**
   * Stores the search input value.
   */
   searchTerm: string = '';

   /**
   * Specify if the user can create roles
   */
    public userCanCreateRole: boolean = undefined;

   /**
   * Specify if the user can create user
   */
    public userCanCreateUser: boolean = undefined;

  searchKeySubject: Subject<string> = new Subject<string>();
  private inputValue: ReplaySubject<string>= new ReplaySubject();

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.watchSearchInputChanges();
    (async () => {
      while (this.accessPermissions && this.accessPermissions.length === 0)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.accessPermissions && Object.keys(this.accessPermissions.auth).length > 0) {
        this.userCanCreateRole = this.accessPermissions.auth.create_role;
        this.userCanCreateUser = this.accessPermissions.auth.create_user;

        this.cdr.detectChanges();
      }
    })();
  }

  private watchSearchInputChanges() {
    this.inputValue.pipe(debounceTime(500)).subscribe((event: string)=>{
      if (event.length > 2) {
        this.searchTerm = event;
        this.tab === 'user' ? this.getUsers() : this.getRoles();
      }
      if (event.length === 0) {
        this.removeSearchTerm();
      }
    })
  }

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
   public applyFilter(keyword: string) {
    this.inputValue.next(keyword);
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.searchTerm = '';
    this.tab === 'user' ? this.getUsers() : this.getRoles();
  }

  private getUsers() {
    this.getUsersList.emit({search: this.searchTerm});
  }

  private getRoles() {
    this.getRolesList.emit({search: this.searchTerm});
  }

  /**
   * Opens a dialog for creating a new user.
   */
  public createNewUser() {
    this.dialog.open(NewUserDialogComponent, {
      width: '700px',
      data: this.rolesList
    }).afterClosed().subscribe((result: string) => {
      if (result) {
        this.getUsersList.emit();
      }
    })
  }

  /**
   * Opens a dialog for creating a new role.
   */
  public createNewRole() {
    this.dialog.open(ManageRoleDialogComponent, {
      width: '500px',
      data: {
        action: 'new'
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'saved') {
        this.getRolesList.emit({});
      }
    })
  }
}
