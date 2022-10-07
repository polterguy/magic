import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { BehaviorSubject } from 'rxjs';
import { BackendService } from '../../services/common/backend.service';
import { Role } from './_models/role.model';
import { User } from './_models/user.model';
import { RoleService } from './_services/role.service';
import { UserService } from './_services/user.service';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.scss']
})
export class UserRolesComponent implements OnInit {

  public isLoading: boolean = true;

  public users = new BehaviorSubject<User[] | null>([]);

  public roles = new BehaviorSubject<Role[]>([]);

  public accessPermissions: any = [];

  /**
    * Total records.
    */
   resultsLength: number = 0;

   private usersCount: number = 0;

   private rolesCount: number = 0;

   /**
    * Number of records per page.
    */
   pageSize: number = 10;

   /**
    * Optoins for changing the number of records per page.
    */
   pageSizeOptions: number[] = [5, 10, 25, 100];

   /**
    * Current page number.
    */
   currentPage: number = 1;

   // MatPaginator Output
   pageEvent!: PageEvent;

   /**
   * Accessing the paginator element in the template.
   */
    @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private roleService: RoleService,
    private backendService: BackendService) { }

  ngOnInit(): void {
    this.getUsersList();
    this.getRolesList();
    (async () => {
      while (this.backendService.active.access && !Object.keys(this.backendService.active.access.auth).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService.active.access && Object.keys(this.backendService.active.access.auth).length > 0) {
        this.accessPermissions = this.backendService.active?.access;

        this.cdr.detectChanges();
      }
    })();
  }

  public tabChange(event: MatTabChangeEvent) {
    if (event.index === 0) {
      if (this.users.getValue().length > 0) {
        this.resultsLength = this.usersCount;
        return;
      } else {
        this.getUsersList();
      }
    } else {
      if (this.roles.getValue().length > 0) {
        this.resultsLength = this.rolesCount;
        return;
      } else {
        this.getRolesList();
      }
    }
  }

  /**
   * Invokes backend to fetch the list of users.
   * @param event search keyword received from child element.
   */
  public getUsersList(event?: { search: string }) {
    // Resets pagination while sorting the table.
    if (event && event.search) {
      this.paginator.pageIndex = 0;
      this.currentPage = 1;
    }
    let param: string = '';
    if (event?.search) {
      param = `?username.like=${encodeURIComponent(event.search)}%`;
    } else {
      param = `?limit=${this.pageSize}&offset=${this.currentPage}`;
    }
    this.userService.list(param).subscribe({
      next: (res: User[]) => {
        this.users.next(res || []);
        res ? this.countUser(event) : this.resultsLength = 0;
        this.cdr.detectChanges();
      },
      error: (error: any) => {}
    })
  }

  /**
   * Invokes backend to fetch the count of the list of users.
   * @param event search keyword received from child element and passed through the previous step.
   */
  private countUser(event?: any) {
    if (event || this.usersCount === 0) {
      const param: string = `${event?.search ? `?username.like=${encodeURIComponent(event.search)}%` : ''}`;
      this.userService.count(param).subscribe({
        next: (res: any) => {
          if (res) {
            this.resultsLength = res.count;
            this.usersCount = res.count;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => { }
      })
    } else { this.isLoading = false; return }
  }

  /**
   * Invokes backend to fetch the list of roles.
   * @param event search keyword received from child element.
   */
  public getRolesList(event?: { search: string }) {
    let param: string = '';
    if (event?.search) {
      param = `?name.like=${encodeURIComponent(event.search)}%`;
    } else {
      param = `?limit=${this.pageSize}&offset=${this.currentPage}`;
    }
    this.roleService.list(param).subscribe({
      next: (res: Role[]) => {
        this.roles.next(res || []);
        res ? this.countRole(event) : this.resultsLength = 0;
        this.cdr.detectChanges();
      },
      error: (error: any) => {}
    })
  }

  /**
   * Invokes backend to fetch the count of the list of roles.
   * @param event search keyword received from child element and passed through the previous step.
   */
  private countRole(event: any) {
    if (event || this.rolesCount === 0) {
      const param: string = `${event?.search ? `?name.like=${encodeURIComponent(event.search)}%` : ''}`;
      this.roleService.count(param).subscribe({
        next: (res: any) => {
          if (res) {
            this.resultsLength = res.count
            this.rolesCount = res.count;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {}
      })
    } else { this.isLoading = false; return }
  }

  /**
   *
   * @param event Event of the page change.
   * @param activeTabIndex Index of the active tab.
   * @callback getUsersList retrieves the list of users if activeTabIndex is 0.
   * @callback getRolesList retrieves the list of roles if activeTabIndex is 1.
   */
   public pageChange(event: PageEvent, activeTabIndex?: number) {
    this.isLoading = true;
    this.pageEvent = event;
    // this.currentPage = event.pageIndex + 1;
    // this.pageSize = this.pageEvent.pageSize;
    this.currentPage = event.pageIndex * this.pageSize;
    activeTabIndex === 0 ? this.getUsersList() : this.getRolesList();
  }
}
