
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

// Application specific imports.
import { ConfigService } from 'src/app/services/config.service';

/**
 * Setup configuration component for allowing user to configure his Magic
 * backend initially.
 */
@Component({
  selector: 'app-setup-configuration',
  templateUrl: './setup-configuration.component.html',
  styleUrls: ['./setup-configuration.component.scss']
})
export class SetupConfigurationComponent implements OnInit {

  /**
   * Configuration of Magic backend.
   */
  public config: any = null;

  /**
   * Database types the user can select during configuration of system.
   */
  public databaseTypes: string[] = [
    'mysql',
    'mssql',
  ];

  /**
   * Currently selected database type.
   */
  public selectedDatabaseType: string = null;

  /**
   * Connection string to database.
   */
  public connectionString: string = null;

  /**
   * Root user's password.
   */
  public password: string = null;

  /**
   * Repeat value of root user's password.
   */
  public passwordRepeat: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Configuration service used to read and save configuration settings
   */
  constructor(private configService: ConfigService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.configService.loadConfig().subscribe(res => {
      this.config = res;
    });
  }

  /**
   * Invoked when selected database type is changed by user.
   */
  public databaseTypeChanged() {
    this.connectionString = this.config.magic.databases[this.selectedDatabaseType].generic;
  }

  /**
   * Saves configuration, default database type, and root password.
   */
  public save() {
    this.configService.setup(
      this.selectedDatabaseType,
      this.password,
      this.config).subscribe(res => {
      console.log(res);
    });
  }
}
