import { Observable } from 'rxjs';

 /**
  * Entity method group containing Create, Read and Delete, but not Update.
  * 
  * This interface is implemented on method groups not containing update,
  * which might happen, if a table have no updateable columns, such as
  * link tables, with only primary keys, etc.
  */
 export interface ICrdEntity {

  /**
   * Creates a new entity.
   *
   * @param args Initial values for your entity
   */
  create(args: any) : Observable<any>;

  /**
   * Reads entities from your backend.
   *
   * @param filter Filter condition for items to retrieve
   */
  read(filter: any) : Observable<any>;

  /**
   * Counts entities from your backend.
   *
   * @param filter Filter condition for items to count
   */
  count(filter: any) : Observable<any>;

  /**
   * Deletes one entity from your backend.
   *
   * @param args Filter condition for item to delete, primary key(s) for entity
   */
  delete(args: any) : Observable<any>;
}

/**
 * Entity method group containing all 4 CRUD operations.
 */
export interface ICrudEntity extends ICrdEntity {

  /**
   * Updates one entity in your backend.
   *
   * @param args What item to update, and what values to update it with
   */
  update(args: any) : Observable<any>;
}
