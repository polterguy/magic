
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Task } from '../models/task.model';
import { HttpService } from './http.service';
import { Count } from '../models/count.model';
import { Response } from '../models/response.model';

/**
 * Task service, allows you to Read, Create, Update and Delete tasks
 * from your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of tasks from your backend.
   * 
   * @param filter Query filter deciding which items to return
   * @param offset Number of items to skip
   * @param limit Maximum number of items to return
   */
  public list(
    filter: string,
    offset: number,
    limit: number) {

    // Dynamically building our query according to arguments specificed.
    let query = '';
    if (filter) {
      query += '&query=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Task[]>(
      '/magic/modules/system/tasks/list-tasks?offset=' +
      offset +
      '&limit=' +
      limit + 
      query);
  }

  /**
   * Retrieves one specific task, and returns to caller.
   * 
   * @param name Name of task to retrieve
   */
  public get(name: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Task>(
      '/magic/modules/system/tasks/get-task?name=' +
      encodeURIComponent(name));
  }

  /**
   * Counts the number of tasks in your backend.
   * 
   * @param filter Query filter for items to include in count
   */
  public count(filter?: string) {

    // Dynamically building our query according to arguments specificed.
    let query = '';
    if (filter) {
      query += '?query=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Count>(
      '/magic/modules/system/tasks/count-tasks' +
      query);
  }

  /**
   * Creates a new task according to the specified arguments.
   * 
   * @param id Unique name or ID of task to create
   * @param hyperlambda Hyperlambda for task
   * @param description Description for task as humanly readable text
   */
  public create(id: string, hyperlambda: string, description: string = null) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>(
      '/magic/modules/system/tasks/create-task', {
        id,
        hyperlambda,
        description,
    });
  }

  /**
   * Updates an existing task according to the specified arguments.
   * 
   * @param id Unique name or ID of task to update
   * @param hyperlambda Hyperlambda for task
   * @param description Description for task as humanly readable text
   */
  public update(id: string, hyperlambda: string, description: string = null) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>(
      '/magic/modules/system/tasks/update-task', {
        id,
        hyperlambda,
        description,
    });
  }
}
