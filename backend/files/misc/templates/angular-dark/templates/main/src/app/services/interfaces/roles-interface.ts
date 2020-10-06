import { Observable } from 'rxjs';
import { AuthFilter } from '../models/auth-filter';
import { CreateResponse } from '../models/create-response';
import { CountResponse } from '../models/count-response';
import { DeleteResponse } from '../models/delete-response';

/**
 * Interface for creating, reading, and deleting roles in your backend.
 */
export interface IRoles {

  /**
   * Creates a new role in your backend.
   * 
   * @param name Name of role to create
   * @param description Description for role
   */
  create(name: string, description: string) : Observable<CreateResponse>;

  /**
   * Reads roles from your backend.
   * 
   * @param filter Filter, including paging conditions for roles to read
   */
  read(filter?: AuthFilter) : Observable<any[]>;

  /**
   * Counts the number of roles in your backend.
   * 
   * @param filter Filtering conditions for roles to include in counting process
   */
  count(filter?: string) : Observable<CountResponse>;

  /**
   * Deletes a roles in your backend.
   * 
   * @param name Name of roles to delete
   */
  delete(name: string) : Observable<DeleteResponse>;
}
  