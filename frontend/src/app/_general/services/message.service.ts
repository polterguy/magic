
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Message } from 'src/app/models/message.model';

/**
 * Message send/receive class, allowing you to subscribe to events,
 * and/or raise events.
 */
@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private subject = new Subject<Message>();

  sendMessage(message: Message) {

    this.subject.next(message);
  }

  subscriber() {

    return this.subject.asObservable();
  }
}
