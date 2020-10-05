import { Observable } from 'rxjs';
import { AuthenticateToken } from '../models/authenticate-token';
import { StatusResponse } from '../models/status-response';

 /**
  * Service interface for methods somehow related to the current user,
  * such as authenticate, change-password, etc.
  */
 export interface IMe {

  /**
   * Returns true if current user are allowed to invoke specified URL/verb combination,
   * otherwise returns false.
   * 
   * @param url URL of endpoint
   * @param verb HTTP verb for endpoint
   */
  canInvoke(url: string, verb: string) : boolean;

  /**
   * Authenticates the current user towards the backend.
   * 
   * @param username Username user supplied
   * @param password Password user supplied
   */
  authenticate(username: string, password: string) : Observable<AuthenticateToken>;

  /**
   * Will refresh the JWT token, by invoking the backend's refresh token endpoint.
   */
  refreshTicket() : Observable<AuthenticateToken>;

  /**
   * Returns true if current user belongs to any of the specified roles,
   * otherwise it returns false.
   * 
   * @param roles Roles to check
   */
  inRole(roles: string[]) : boolean;

  /**
   * Returns true if current user is authenticate, otherwise false.
   */
  isLoggedIn() : boolean;

  /**
   * Destroys the persisted JWT token for the current user, effectively
   * logging out the user from the backend.
   */
  logout() : void;

  /**
   * Changes the currently authenticated user's password, by invoking the backend
   * endpoint responsible for updating the user's password.
   * 
   * @param password New password for user
   */
  changePassword(password: string) : Observable<StatusResponse>;
}
