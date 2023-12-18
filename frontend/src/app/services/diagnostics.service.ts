
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { SystemReport } from '../models/dashboard.model';

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
