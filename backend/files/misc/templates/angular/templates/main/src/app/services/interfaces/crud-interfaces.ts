import { Observable } from 'rxjs';
import { CreateResponse } from '../models/create-response';
import { CountResponse } from '../models/count-response';
import { UpdateResponse } from '../models/update-response';
import { DeleteResponse } from '../models/delete-response';

/**
 * Entity method group containing only Read, but not Update, Create or Delete.
 * 
 * This interface is implemented on method groups not containing update, create or delete,
 * which might happen if user explicitly chooses to not generate a frontend with these
 * endpoints included.
 */
export interface IREntity {

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
}

/**
 * Entity method group containing Create and Read, but not Update or Delete.
 * 
 * This interface is implemented on method groups not containing update or delete,
 * which might happen if a table have no primary keys.
 */
export interface ICrEntity extends IREntity {

  /**
   * Creates a new entity.
   *
   * @param args Initial values for your entity
   */
  create(args: any) : Observable<CreateResponse>;
}

/**
 * Entity method group containing Read, Update and Delete, but not Create.
 * 
 * This interface is implemented on method groups not containing create.
 */
 export interface IRuEntity extends IREntity {

  /**
   * Updates one entity in your backend.
   *
   * @param args What item to update, and what values to update it with. Must at the very least contain your entity's primary key.
   */
   update(args: any) : Observable<UpdateResponse>;
}

/**
 * Entity method group containing Read and Delete, but not Update or Create.
 * 
 * This interface is implemented on method groups not containing update or create,
 * which might happen if a table have only automatic columns.
 */
 export interface IRdEntity extends IREntity {

  /**
   * Deletes one entity from your backend.
   *
   * @param args Filter condition for item to delete, implying primary key(s) for entity
   */
  delete(args: any) : Observable<DeleteResponse>;
}

/**
 * Entity method group containing Create, Read and Delete, but not Update.
 * 
 * This interface is implemented on method groups not containing update,
 * which might happen, if a table have no updateable columns, such as
 * link tables, with only primary keys, etc.
 */
export interface ICrdEntity extends IREntity {

  /**
   * Creates a new entity.
   *
   * @param args Initial values for your entity
   */
  create(args: any) : Observable<CreateResponse>;

  /**
   * Deletes one entity from your backend.
   *
   * @param args Filter condition for item to delete, implying primary key(s) for entity
   */
  delete(args: any) : Observable<DeleteResponse>;
}

/**
 * Entity method group containing Read, Update and Delete, but not Create.
 * 
 * This interface is implemented on method groups not containing create.
 */
 export interface IRudEntity extends IREntity {

  /**
   * Updates one entity in your backend.
   *
   * @param args What item to update, and what values to update it with. Must at the very least contain your entity's primary key.
   */
   update(args: any) : Observable<UpdateResponse>;

  /**
   * Deletes one entity from your backend.
   *
   * @param args Filter condition for item to delete, implying primary key(s) for entity
   */
   delete(args: any) : Observable<DeleteResponse>;
}

/**
 * Entity method group containing Create, Read and Update, but not Delete.
 * 
 * This interface is implemented on method groups not containing delete.
 */
export interface ICruEntity extends IREntity {

  /**
   * Creates a new entity.
   *
   * @param args Initial values for your entity
   */
   create(args: any) : Observable<CreateResponse>;

  /**
   * Updates one entity in your backend.
   *
   * @param args What item to update, and what values to update it with. Must at the very least contain your entity's primary key.
   */
   update(args: any) : Observable<UpdateResponse>;
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
