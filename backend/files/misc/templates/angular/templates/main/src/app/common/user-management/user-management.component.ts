
// Angular specific imports
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { User, UsersService } from '@app/services/users-service';
import { AuthService } from '@app/services/auth-service';
import { animate, state, style, transition, trigger } from '@angular/animations';

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
   * Currently viewed users.
   */
  public users: User[] = null;

  /**
   * How many users exists in total.
   */
  public itemsCount: number;

  /**
   * How many users to view simultaneously.
   */
  public limit: number = 25;

  /**
   * Creates an instance of your component.
   * 
   * @param usersService Needed to be able to retrieve users from backend
   * @param authService Needed to determine if user has access to operations on users
   */
  constructor(
    private usersService: UsersService,
    public authService: AuthService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Retrieves initial users
    this.getData();

    /*
     * Creating our filtering FormControl instances, which gives us "live filtering"
     * on our columns.
     */
    this.username = new FormControl('');
    this.username.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        console.log(query);
      });
  }

  /**
   * Invoked when paging occurs.
   */
  paged(e: PageEvent) {

  }

  /*
   * Responsible for retrieving items from backend.
   */
  private getData() {
    this.usersService.users().subscribe({
      next: (users: User[]) => {
        this.users = users;
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }
}
