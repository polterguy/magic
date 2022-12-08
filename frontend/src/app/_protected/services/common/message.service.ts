
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Message } from '../../models/common/message.model';

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
   * @param message Message to transmit to subscribers
   */
  sendMessage(message: Message) {
    this.subject.next(message);
  }

  /**
   * Returns the observable allowing you to subscribe to messages
   * transmitted by other components.
   */
  subscriber() {
    return this.subject.asObservable();
  }
}
