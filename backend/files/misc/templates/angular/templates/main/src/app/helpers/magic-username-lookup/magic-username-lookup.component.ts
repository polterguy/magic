
// Angular imports.
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { UsersService, User } from '@app/services/users-service';

/**
 * Selector component allowing you to have a selector dropdown list
 * during editing/creating of items, for items with a username reference,
 * which is a lookup into magic users database. Usage would be
 * something like the following in your HTML.

  <magic-username-lookup
    *ngIf="canEditColumn('locale_id')"
    [model]="data.entity"
    field="locale_id"
    class="entity-edit-field"
    (change)="changed('locale_id')">
  </magic-username-lookup>

 * The above would create a select list for you, allowing you to
 * select users from a list of items, instead
 * of having user to manually type in the correct username.
 * 
 * The (change) part is an output emitter, invoked as the currently selected
 * value has been changed.
 */
@Component({
  selector: 'app-magic-username-lookup',
  templateUrl: './magic-username-lookup.component.html',
  styleUrls: ['./magic-username-lookup.component.scss'],
})
export class MagicUsernameLookupComponent implements OnInit {
  /**
   * Model you're databinding towards.
   */
  @Input() public model: any;

  /**
   * Field in the model that is databound towards the selected key.
   */
  @Input() public field: string;

  /**
   * Callback to invoke once item is changed.
   */
  @Output() public change: EventEmitter<any> = new EventEmitter();

  /**
   * Contains actual databound items, after having fetched
   * them from the backend.
   */
  public items: User[];

  /**
   * Creates an instance of your component.
   * 
   * @param usersService Needed to fetch users from backend
   */
  constructor(private usersService: UsersService) {}

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Retrieving users from backend.
    this.usersService.users('').subscribe({
      next: (res: User[]) => {
        this.items = res || [];
      },
      error: (error) => console.error('Could not get items in MagicSelector')
    });
  }

  /**
   * Invoked when value is changed.
   */
  public valueChanged() {
    // Emitting changed event, if consumer provided a callback for it
    this.change?.emit();
  }
}
