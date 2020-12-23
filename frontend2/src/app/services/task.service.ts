
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

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

  /**
   * Deletes the specified id task.
   * 
   * @param id Unique name or ID of task to delete
   */
  public delete(id: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/tasks/delete-task?id=' +
      encodeURIComponent(id));
  }

  /**
   * Creates a new task according to the specified arguments.
   * 
   * @param id Unique name or ID of task to create
   * @param hyperlambda Hyperlambda for task
   * @param description Description for task as humanly readable text
   */
  public schedule(id: string, due?: Date, repeats?: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>(
      '/magic/modules/system/tasks/add-due', {
        id,
        due,
        repeats,
    });
  }

  /**
   * Deletes the specified schedule for task.
   * 
   * @param id ID of task schedule to delete
   */
  public deleteSchedule(id: number) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/tasks/delete-due?id=' + id);
  }

  /**
   * Downloads a task by invoking backend.
   * 
   * @param ID Unique ID or name of task to download
   */
  public download(id: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.download(
      '/magic/modules/system/tasks/download-task?name=' +
      encodeURIComponent(id)).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');;
        const file = new Blob([res.body]);
        saveAs(file, filename);
      });
  }
}
