
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

/**
 * Home component for Macgi Dashboard.
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
