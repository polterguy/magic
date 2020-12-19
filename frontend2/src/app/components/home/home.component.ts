
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { AuthService } from 'src/app/services/auth.service';

/**
 * Home component for Magic Dashboard.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /**
   * Creates an instance of your component.
   * 
   * @param authService Authentication and authorisation service
   */
  constructor(public authService: AuthService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
  }
}
