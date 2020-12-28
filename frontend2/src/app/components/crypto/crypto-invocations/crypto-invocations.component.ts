
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { CryptoService } from 'src/app/services/crypto.service';

/**
 * Displays all cryptographically signed invocations towards server.
 */
@Component({
  selector: 'app-crypto-invocations',
  templateUrl: './crypto-invocations.component.html',
  styleUrls: ['./crypto-invocations.component.scss']
})
export class CryptoInvocationsComponent implements OnInit {

  /**
   * Creates an instance of your component.
   * 
   * @param cryptoService Needed to retrieve cryptographically signed invocations from backend
   */
  constructor(private cryptoService: CryptoService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving initial invocations.
    this.getInvocations();
  }

  /**
   * Retrieves invocations from backend.
   */
  public getInvocations() {

    // Invoking backend to retrieve invocations.
    this.cryptoService.invocations().subscribe((invocations: any[]) => {
      console.log(invocations);
    });
  }
}
