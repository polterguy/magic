import { Observable } from 'rxjs';
import { AuthFilter } from '../models/auth-filter';
import { CreateResponse } from '../models/create-response';
import { CountResponse } from '../models/count-response';
import { DeleteResponse } from '../models/delete-response';

/**
 * Interface for creating, reading, and deleting users from
 * your backend - In addition to retireving, associating, and disassociating users
 * with roles.
 */
export interface IUsers {

  /**
   * Creates a new user in your backend.
   * 
   * @param username Username of user to create
   * @param password Initial password for user
   */
  create(username: string, password: string) : Observable<CreateResponse>;

  /**
   * Reads users from your backend.
   * 
   * @param filter Filter for users, including paging information
   */
  read(filter?: AuthFilter) : Observable<any[]>;

  /**
   * Counts users in your backend.
   * 
   * @param filter Filter for users to include in count
   */
  count(filter?: string) : Observable<CountResponse>;

  /**
   * Deletes a user from your backend.
   * 
   * @param username Name of user to delete.
   */
  delete(username: string) : Observable<DeleteResponse>;

  /**
   * Retrieves all the roles belonging to a specific user.
   * 
   * @param username Name of user to retrieve roles for
   */
  roles(username: string) : Observable<any[]>;

  /**
   * Associates a user with a role in the backend.
   * 
   * @param user Name of user to add to specified role
   * @param role Role to add to specified user
   */
  addRole(user: string, role: string) : Observable<CreateResponse>;

  /**
   * Removes (disassociates) a user with a role.
   * 
   * @param user Name of user to disassociate with role
   * @param role Name of role to disassociate with user
   */
  deleteRole(user: string, role: string) : Observable<DeleteResponse>;
}
  