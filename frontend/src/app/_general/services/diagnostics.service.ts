
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/_general/services/http.service';
import { SystemReport } from '../../_protected/pages/dashboard/_models/dashboard.model';

/**
 * Diagnostics service providing you with diagnostics information about your system.
 */
@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService {

  constructor(private httpService: HttpService) { }

  getSystemReport() {
    return this.httpService.get<SystemReport[]>('/magic/system/diagnostics/system-information');
  }
}
