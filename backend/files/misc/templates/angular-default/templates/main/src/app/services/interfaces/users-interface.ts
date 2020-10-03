import { AuthFilter } from '../models/auth-filter';
import { Observable } from 'rxjs';

/**
 * Interface for creating, reading, and deleting users from your backend.
 */
export interface IUsers {

  /**
   * Creates a new user in your backend.
   * 
   * @param username Username of user to create
   * @param password Initial password for user
   */
  create(username: string, password: string) : Observable<any>;

  /**
   * Reads users from your backend.
   * 
   * @param filter Filter for users, including paging information
   */
  read(filter?: AuthFilter) : Observable<any>;

  /**
   * Counts users in your backend.
   * 
   * @param filter Filter for users to include in count
   */
  count(filter?: string) : Observable<any>;

  /**
   * Deletes a user from your backend.
   * 
   * @param username Name of user to delete.
   */
  delete(username: string) : Observable<any>;

  /**
   * Retrieves all the roles belonging to a specific user.
   * 
   * @param username Name of user to retrieve roles for
   */
  roles(username: string) : Observable<any>;

  /**
   * Associates a user with a role in the backend.
   * 
   * @param user Name of user to add to specified role
   * @param role Role to add to specified user
   */
  addRole(user: string, role: string) : Observable<any>;

  /**
   * Removes (disassociates) a user with a role.
   * 
   * @param user Name of user to disassociate with role
   * @param role Name of role to disassociate with user
   */
  deleteRole(user: string, role: string) : Observable<any>;
}
  