
// Angular imports.
import { Observable } from 'rxjs';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

/**
 * Selector component allowing you to have a selector dropdown list
 * during editing/creating of items, for items where you have a foreign key,
 * which is a lookup into another database table. Usage would be
 * something like the following in your HTML.

  <app-magic-selector
    *ngIf="canEditColumn('locale_id')"
    [model]="data.entity"
    field="locale_id"
    key="id"
    value="language"
    placeholder="Choose a language"
    class="entity-edit-field"
    (change)="changed('locale_id')"
    [getItems]="service.languages.read({limit:-1})">
  </app-magic-selector>

 * The above would create a select list for you, allowing you to
 * select from a list of items, declared in a database table, instead
 * of having user to manually type in the correct key.
 *
 * In the above example the main table has a field called 'locale_id',
 * which is a foreign key leading into the 'languages' 'id' column,
 * and you want to display the 'language' field to the end user.
 * 
 * The (change) part is an output emitter, invoked as the currently selected
 * value has been changed.
 */
@Component({
  selector: 'app-magic-selector',
  templateUrl: './magic-selector.component.html',
  styleUrls: ['./magic-selector.component.scss'],
})
export class MagicSelectorComponent implements OnInit {
  /**
   * Model you're databinding towards.
   */
  @Input() public model: any;

  /**
   * Field in the model that is databound towards the selected key.
   */
  @Input() public field: string;

  /**
   * Key in the referenced table that the field is changed to as
   * an item is selected.
   */
  @Input() public key: string;

  /**
   * Field in the referenced table that is displayed to the user
   * allowing him to select a specific item.
   */
  @Input() public value: string;

  /**
   * Placeholder value (tooltip) of selector component.
   */
  @Input() public placeholder: string;

  /**
   * Observable callback for component to retrieve items
   * to databound towards from backend HTTP service.
   */
  @Input() public getItems: Observable<any>;

  /**
   * Callback to invoke once item is changed.
   */
  @Output() public change: EventEmitter<any> = new EventEmitter();

  /**
   * Contains actual databound items, after having fetched
   * them from the backend.
   */
  public items: any[];

  /**
   * OnInit implementation.
   */
  public ngOnInit() {
    this.getItems.subscribe({
      next: (res: any[]) => {
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
