import { Injectable } from '@angular/core';
import { Subject} from 'rxjs';

/**
 * Message class, encapsulating a message sent from one component to another.
 */
export class Message {

  /**
   * Name of message that was transmitted.
   */
  name: string;

  /**
   * Content/data the message either expects or returns after being handled.
   */
  content?: any = null;
}

/**
 * Common messages wrapper class. Contains static fields
 * for the most common messages system will publish,
 * and/or handle somehow.
 */
export class Messages {

  /**
   * Send this message to retrieve roles currently logged
   * in user belongs to, if any.
   */
  static readonly GET_ROLES = 'app.roles.get';

  /**
   * Send this message to retrieve all endpoints in the system,
   * associated with their HTTP verb and roles that are able to
   * invoke the endpoint.
   */
  static readonly GET_ENDPOINTS = 'app.endpoints.get';

  /**
   * Message will be published by the system whenever all endpoints,
   * their associated HTTP verbs, and roles able to invoke them have
   * been retrieved.
   */
  static readonly ENDPOINTS_FETCHED = 'app.endpoints.fetched';

  /**
   * Message will be published by the system whenever all roles
   * have been fetched, and/or user have logged in, and authorization
   * for some reasons have changed.
   */
  static readonly ROLES_FETCHED = 'app.roles.fetched';
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private subject = new Subject<Message>();

  /**
   * Sends a message to any subscribers.
   * 
   * @param message Message to transmit to other listeners
   */
  sendMessage(message: Message) {
    this.subject.next(message);
  }

  /**
   * Sends a message to any subscribers.
   * 
   * @param message Message to transmit to other listeners
   */
  getValue(name: string) {
    let msg = {
      name,
      content: null,
    };
    this.subject.next(msg);
    return msg.content;
  }

  /**
   * Returns the observable allowing you to subscribe to messages
   * transmitted by other components.
   */
  subscriber() {
    return this.subject.asObservable();
  }
}