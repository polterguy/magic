import { Observable } from 'rxjs';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

/**
 * Selector component allowing you to have a selector dropdown list
 * during editing/creating of items, for items where you have a key,
 * which is a lookup into another database table. Usage would be
 * something like the following in your markup.
 *
 * <app-selector
 *   key="locale"
 *   value="language"
 *   [model]="data.entity"
 *   [placeholder]="Choose a language"
 *   (change)="changed('language')"
 *   [getItems]="service.languages.read({limit:-1})">
 * </app-selector>
 *
 * The above would create a select list for you, allowing you to
 * select from a list of items, declared in a database table, instead
 * of having user to manually type in the correct key.
 *
 * For the above you have 'data.entity.locale' normally being bound
 * towards an input field, and the services.languages_Get method returns
 * a list of items with a 'key' and a 'description', where the value of
 * the 'data.entity.locale' would be expected to be the value of your
 * select list when an item is chosen, with 'description' being its friendly
 * description(s).
 */
@Component({
  selector: 'app-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss'],
})
export class SelectorComponent implements OnInit {
  /**
   * Model you're databinding towards.
   */
  @Input() public model: any;

  /**
   * Key in the model, that you want this particular object
   * to be databound towards.
   */
  @Input() public key: string;

  /**
   * Readable value for item, being the thing the end user
   * sees as he or she is editing the item.
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
    this.getItems.subscribe((res) => {
      this.items = res;
    });
  }

  /**
   * Invoked when value is changed.
   */
  public valueChanged() {
    this.change?.emit();
  }
}
