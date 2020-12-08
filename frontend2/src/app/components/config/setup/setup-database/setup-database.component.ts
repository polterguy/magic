
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import data from './data/data.json';
import { Crudify } from 'src/app/models/crudify.model';
import { Messages } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { LocResult } from 'src/app/models/loc-result.model';
import { ConfigService } from 'src/app/services/config.service';
import { CrudifyService } from 'src/app/services/crudify.service';
import { MessageService } from 'src/app/services/message.service';
import { BaseComponent } from 'src/app/components/base.component';
import { LoaderInterceptor } from 'src/app/services/interceptors/loader.interceptor';

// CodeMirror options.
import json from '../../../../codemirror/json.json';

/**
 * Component that helps you crudify your magic database
 * during the setup process of Magic.
 */
@Component({
  selector: 'app-setup-database',
  templateUrl: './setup-database.component.html',
  styleUrls: ['./setup-database.component.scss']
})
export class SetupDatabaseComponent extends BaseComponent implements OnInit {

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * Database type we're using, e.g. 'mysql' or 'mssql'.
   */
  public databaseType: string = null;

  /**
   * Data for CodeMirror instance to show crudify input to user,
   * allowing him to edit it if he wants to.
   */
  public crudifyContent: string = null;

  /**
   * Number of HTTP endpoints that will be generated as user clicks setup button.
   */
  public count: number;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Configuration service used to read and write configuration settings, etc
   * @param crudifyService Crudify service to use for crudifying the magic database
   * @param loaderInterceptor Used to explicitly turn on and off the spinner animation
   * @param messageService Message service used to publish messages informing parent component about change of state
   */
  public constructor(
    private configService: ConfigService,
    private crudifyService: CrudifyService,
    private loaderInterceptor: LoaderInterceptor,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Figuring out which database type the backend is using for its Magic database.
    this.configService.defaultDatabaseType().subscribe((res: Response) => {

      // Making sure we apply the database type for every item in JSON file.
      for (const idx of data) {
        idx.databaseType = res.result;
      }

      // Setting the database type.
      this.databaseType = res.result;

      // Parsing data JSON file to display in CodeMirror editor, and figuring out how many endpoints we'll need to crudify.
      this.crudifyContent = JSON.stringify(data, null, 2);
      this.count = data.length;

      // Making sure we hide loader service that was explicitly shown in previous step.
      this.loaderInterceptor.decrement();
    }, (error: any) => {

      // Oops ...!!
      this.showError(error);
      this.loaderInterceptor.decrement();
    });
  }

  /**
   * Crudifies your magic database.
   */
  public setup() {

    // Parsing JSON to use as input for HTTP invocation to backend.
    const endpoints = <Crudify[]>JSON.parse(this.crudifyContent);

    // Creating an array of observables.
    const forks = endpoints.map(x => this.crudifyService.crudify(x));

    // Awaiting all observables.
    this.loaderInterceptor.increment();
    forkJoin(forks).subscribe((res: LocResult[]) => {

      // Finished, showing some information to user.
      const loc = res.reduce((x,y) => x + y.loc, 0);
      this.showInfo(`Your Magic database was successfully crudified. ${loc} LOC generated.`);

      // Publishing message to inform parent component that we're done here.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED,
        content: 'database'
      });
    }, (error: any) => this.showError(error));
  }
}
