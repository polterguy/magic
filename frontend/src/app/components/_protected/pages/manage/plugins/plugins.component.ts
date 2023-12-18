
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { ViewPluginComponent } from './components/view-app/view-plugin.component';
import { AppManifest } from '../../../../../models/app-manifest';
import { BazarService } from 'src/app/services/bazar.service';
import { BazarApp } from 'src/app/models/bazar-app.model';

/**
 * Plugin component displaying available plugins from Bazar.
 */
@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss']
})
export class PluginsComponent implements OnInit {

  private availablePlugins: any = [];
  private installedPlugins: any = [];

  isLoading: boolean = true;
  searchKey: string = null;

  constructor(
    private dialog: MatDialog,
    private bazarService: BazarService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.loadAvailablePlugins();
  }

  viewAppDetails(item: any) {

    this.dialog.open(ViewPluginComponent, {
      minWidth: '500px',
      data: item
    }).afterClosed().subscribe((res: string) => {
      if (res === 'install') {
        this.install(item);
      }
    });
  }

  filterList(event: { searchKey: string }) {

    this.searchKey = event.searchKey ?? null;
  }

  getPluginsToDisplay() {

    return this.availablePlugins.filter((x: any) => {
      if (x.installed) {
        return false;
      }
      if (this.searchKey && this.searchKey.length > 0 && x.name.toLowerCase().indexOf(this.searchKey.toLowerCase()) === -1) {
        return false;
      }
      return true;
    });
  }

  install(plugin: any) {

    this.bazarService.installPlugin(plugin).subscribe({

      next: () => {

        plugin.installed = true;
        this.generalService.showFeedback(
          'You can leave this page now, you will be notified when plugin is installed.',
          'successMessage');
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  /*
   * Private helper methods.
   */

  private loadAvailablePlugins() {

    this.generalService.showLoading();
    this.bazarService.availablePlugins(null, 0, 1000).subscribe({

      next: (apps: BazarApp[]) => {

        this.availablePlugins = apps;
        this.loadInstalledPlugins();
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  private loadInstalledPlugins() {

    this.bazarService.installedPlugins().subscribe({

      next: (manifests: AppManifest[]) => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.installedPlugins = manifests || [];

        this.availablePlugins.map((idxAvailable: any) => {
          idxAvailable.installed = this.installedPlugins.filter((x: any) => x.module_name === idxAvailable.folder_name).length > 0;
        });
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }
}
