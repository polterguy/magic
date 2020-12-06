
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import data from './data/data.json';
import { Messages } from 'src/app/models/message.model';
import { ConfigService } from 'src/app/services/config.service';
import { CrudifyService } from 'src/app/services/crudify.service';
import { MessageService } from 'src/app/services/message.service';
import { BaseComponent } from 'src/app/components/base.component';

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
   * @param configService Configuration service used to read and write configuration settings, etc
   * @param messageService Message service used to publish messages informing parent component about change of state
   */
  public constructor(
    private crudifyService: CrudifyService,
    private configService: ConfigService,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Figuring out which database type the backend is using for its Magic database.
    this.configService.defaultDatabaseType().subscribe(res => {

      // Making sure we apply the database type for every item in JSON file.
      for (const idx of data) {
        idx.databaseType = res.type;
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

    // Parsing JSON to use as input for HTTP invocation to backend.
    const endpoints = <any[]>JSON.parse(this.crudifyContent);

    // Creating an array of observables.
    const forks = endpoints.map(x => this.crudifyService.crudify(x));

    // Awaiting all observables.
    forkJoin(forks).subscribe((res: any[]) => {

      // Finished, showing some information to user.
      this.showInfo('Your Magic database was successfully crudified');

      // Publishing message to inform parent component that we're done here.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED,
        content: 'database'
      });
    }, (error: any) => this.showError(error));
  }
}
