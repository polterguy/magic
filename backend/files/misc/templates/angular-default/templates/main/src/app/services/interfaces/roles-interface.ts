import { AuthFilter } from '../models/auth-filter';
import { Observable } from 'rxjs';

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
  create(name: string, description: string) : Observable<any>;

  /**
   * Reads roles from your backend.
   * 
   * @param filter Filter including paging conditions for roles to read
   */
  read(filter?: AuthFilter) : Observable<any>;

  /**
   * Counts the number of roles in your backend.
   * 
   * @param filter Filtering conditions for roles to include in counting process
   */
  count(filter?: string) : Observable<any>;

  /**
   * Deletes a roles in your backend.
   * 
   * @param name Name of roles to delete
   */
  delete(name: string) : Observable<any>;
}
  