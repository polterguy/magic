
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';

/**
 * Health component to display meta information related to the system's health, such
 * as number of log items, failed login attempts, etc.
 */
@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.scss']
})
export class HealthComponent {
}
