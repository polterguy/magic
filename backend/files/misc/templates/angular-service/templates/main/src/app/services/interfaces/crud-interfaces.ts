import { Observable } from 'rxjs';
import { CreateResponse } from '../models/create-response';
import { CountResponse } from '../models/count-response';
import { UpdateResponse } from '../models/update-response';
import { DeleteResponse } from '../models/delete-response';

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
  create(args: any) : Observable<CreateResponse>;

  /**
   * Reads entities from your backend.
   *
   * @param filter Filter condition for items to retrieve
   */
  read(filter: any) : Observable<any[]>;

  /**
   * Counts entities from your backend.
   *
   * @param filter Filter condition for items to count
   */
  count(filter: any) : Observable<CountResponse>;

  /**
   * Deletes one entity from your backend.
   *
   * @param args Filter condition for item to delete, implying primary key(s) for entity
   */
  delete(args: any) : Observable<DeleteResponse>;
}

/**
 * Entity method group containing all 4 CRUD operations.
 */
export interface ICrudEntity extends ICrdEntity {

  /**
   * Updates one entity in your backend.
   *
   * @param args What item to update, and what values to update it with. Must at the very least contain your entity's primary key.
   */
  update(args: any) : Observable<UpdateResponse>;
}
