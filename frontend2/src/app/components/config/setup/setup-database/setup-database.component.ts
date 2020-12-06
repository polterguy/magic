
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import data from './data/data.json';
import { Messages } from 'src/app/models/message.model';
import { ConfigService } from 'src/app/services/config.service';
import { CrudifyService } from 'src/app/services/crudify.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Component that helps you crudify your magic database
 * during the setup process of Magic.
 */
@Component({
  selector: 'app-setup-database',
  templateUrl: './setup-database.component.html',
  styleUrls: ['./setup-database.component.scss']
})
export class SetupDatabaseComponent implements OnInit {

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
   * @param crudifyService Crudify service to use for crudifying the magic database
   * @param messageService Message service used to publish messages informing parent component about change of state
   */
  public constructor(
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    private configService: ConfigService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Figuring out which database type the backend is using for its Magic database.
    this.configService.defaultDatabaseType().subscribe(res => {

      // Making sure we apply the database type for every item in JSON file.
      for (const idx of data) {
        idx['databaseType'] = res.type;
      }

      // Setting the database type.
      this.databaseType = res.type;

      // Parsing data JSON file to display in CodeMirror editor, and figuring out how many endpoints we'll need to crudify.
      this.crudifyContent = JSON.stringify(data, null, 2);
      this.count = data.length;
    });
  }

  /**
   * Crudifies your magic database.
   */
  public setup() {
    const endpoints = <any[]>JSON.parse(this.crudifyContent);
    this.crudifyTopEndpoint(endpoints);
  }

  /*
   * Private helper methods.
   */

  private crudifyTopEndpoint(endpoints: any[]) {

    // Checking to see if we're done.
    if (endpoints.length === 0) {

      // Finished, showing some information to user.
      this.messageService.sendMessage({
        name: Messages.SHOW_INFO,
        content: 'Your Magic database was successfully crudified',
      });

      // Publishing message to inform parent component that we're done here.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED,
        content: 'database'
      });
      return;
    }

    // Not done yet, crudifying top endpoint.
    this.crudifyService.crudify(endpoints[0]).subscribe((res: any) => {

      /*
       * Invoking self, removing recently crudified endpoint from list of
       * endpoints to crudify.
       */
      this.crudifyTopEndpoint(endpoints.slice(1, endpoints.length));
    }, (error: any) => {

      // Oops, error!
      this.messageService.sendMessage({
        name: Messages.SHOW_ERROR,
        content: error
      });
    });
  }
}
