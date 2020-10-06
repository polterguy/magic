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
   * Message will be published by the system when the user logs in.
   */
  static readonly LOGGED_IN = 'app.user.logged-in';

  /**
   * Message will be published by the system when the user logs out.
   */
  static readonly LOGGED_OUT = 'app.user.logged-out';
}

/**
 * Message send/receive class, allowing you to subscribe to events,
 * and/or raise events.
 */
@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private subject = new Subject<Message>();

  /**
   * Sends a message to all subscribers.
   * 
   * @param message Message to transmit to other listeners
   */
  sendMessage(message: Message) {
    this.subject.next(message);
  }

  /**
   * Sends a message to all subscribers, assuming handlers
   * adds data to the message, and returns that data to caller.
   * Useful for one component to request data from another component.
   * 
   * @param message Message to transmit to listeners
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