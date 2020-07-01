import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  protected abstract getUpdateMethod() : Observable<any>;

  /**
   * Returns a reference to the create method, to create new entities.
   */
  protected abstract getCreateMethod() : Observable<any>;

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
   * Invoked when the user clicks the "Save" button.
   */
  public save() {

    if (this.getData().isEdit) {

      for (const idx in this.getData().entity) {
        if (this.updateColumns.indexOf(idx) === -1) {
          delete this.getData().entity[idx];
        }
      }

      this.getUpdateMethod().subscribe(res => {
        this.close(this.getData().entity);
        if (res['updated-records'] !== 1) {
          this.snackBar.open(`Oops, number of items was ${res['updated-records']}, which is very wrong. Should have been 1`, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      }, (error: any) => {
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    } else {

      for (const idx in this.getData().entity) {
        if (this.createColumns.indexOf(idx) === -1) {
          delete this.getData().entity[idx];
        }
      }

      this.getCreateMethod().subscribe(res => {
        this.close(this.getData().entity);
        if (res === null || res === undefined) {
          this.snackBar.open(`Oops, for some reasons backend returned ${res}, which seems to be very wrong!`, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      }, (error: any) => {
        this.snackBar.open(error.error.message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
    }
  }
}
