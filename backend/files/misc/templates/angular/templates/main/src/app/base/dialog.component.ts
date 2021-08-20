import { Observable, Subscriber } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UpdateResponse } from '../services/models/update-response';
import { CreateResponse } from '../services/models/create-response';

/**
 * Input data to dialog.
 * Notice, if dialog is instantiated in "create entity mode", the
 * entity property will be an empty object, with no fields.
 */
export interface DialogData {
  isEdit: boolean;
  entity: any;
}

/**
 * Base class for all dialog components, allowing user to edit or
 * create new items.
 */
export abstract class DialogComponent {

  protected createColumns: string[] = [];
  protected updateColumns: string[] = [];
  protected primaryKeys: string[] = [];
  private changedValues: string[] = [];

  /**
   * Constructor for dialog component, taking a bunch of additional components,
   * dependency injected into derived component's constructor.
   * 
   * @param snackBar Snack bar to use for disploaying errors.
   */
  constructor(protected snackBar: MatSnackBar) { }

  /**
   * Returns a reference to ths DialogData that was dependency injected
   * into component during creation.
   */
  protected abstract getData() : DialogData;

  /**
   * Returns a reference to the update method, to update entity.
   */
  protected getUpdateMethod() : Observable<UpdateResponse> {
    return new Observable<UpdateResponse>((observer: Subscriber<UpdateResponse>) => {
      observer.error({
        error: {
          message: 'You cannot update these entities, since there exists no PUT endpoint for it'
        }
      });
      observer.complete();
    });
  }

  /**
   * Returns a reference to the create method, to create new entities.
   */
  protected abstract getCreateMethod() : Observable<CreateResponse>;

  /**
   * Closes dialog.
   * 
   * @param data Entity that was created or updated
   */
  public abstract close(data: any) : void;

  /**
   * Returns true if specified column can be edited.
   */
  public canEditColumn(name: string) {
    if (this.getData().isEdit) {
      return this.updateColumns.filter(x => x === name).length > 0 &&
        this.primaryKeys.filter(x => x === name).length == 0;
    }
    return this.createColumns.filter(x => x === name).length > 0;
  }

  /**
   * Invoked when a field is edited by the user, and marks a field
   * as "dirty", implying it'll need to be transmitted to backend,
   * during update invocations.
   * 
   * @param field Name of field that was edited
   */
  public changed(field: string) {
    if (this.changedValues.filter(x => x == field).length === 0) {
      this.changedValues.push(field);
    }
  }

  /**
   * Invoked when the user clicks the "Save" button.
   * 
   * Will either create a new item or update an existing, depending upon
   * whether or not this is an edit or create operation.
   */
  public upsert() {

    // Sanity checking invocation, making sure user actually edited something.
    if (this.changedValues.length === 0) {
      this.snackBar.open(this.getData().isEdit ? 'No values were changed' : 'No record was created',
        'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
      });
      this.close(null);
      return;
    }

    // Making sure we set all values having an empty string to 'null values'.
    const data = this.getData();
    debugger;
    for (const idx in data.entity) {
      if (data.entity[idx] === '') {

        // Changing value to NULL.
        data.entity[idx] = null;
      }
    }

    // Checking if this is edit invocation or create invocation.
    if (data.isEdit) {

      for (const idx in data.entity) {
        if (this.updateColumns.indexOf(idx) === -1 ||
          (this.primaryKeys.indexOf(idx) === -1 &&
            this.changedValues.indexOf(idx) === -1)) {
          delete data.entity[idx];
        }
      }

      this.getUpdateMethod().subscribe((res: UpdateResponse) => {
        this.close(this.getData().entity);
      }, (error: any) => {
        console.error(error);
        this.snackBar.open('I could not update your entity, are you sure you supplied correct data?', 'Close', {
          duration: 10000,
        });
      });
    } else {

      for (const idx in data.entity) {
        if (this.createColumns.indexOf(idx) === -1) {
          delete data.entity[idx];
        }
      }

      this.getCreateMethod().subscribe((res: CreateResponse) => {
        this.close(this.getData().entity);
      }, (error: any) => {
        console.log(error);
        this.snackBar.open('I could not create your entity, are you sure you supplied correct data?', 'Close', {
          duration: 10000,
        });
      });
    }
  }
}
