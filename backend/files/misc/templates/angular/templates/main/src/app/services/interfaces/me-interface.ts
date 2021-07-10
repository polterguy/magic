import { Observable } from 'rxjs';
import { AuthenticateToken } from '../models/authenticate-token';

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
}
