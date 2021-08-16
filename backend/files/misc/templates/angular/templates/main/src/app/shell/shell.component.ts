import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MediaObserver } from '@angular/flex-layout';

import { AuthenticationService, CredentialsService } from '@app/auth';
import { AuthService } from '@app/services/auth-service';
import { MessageService } from '@app/services/message.service';
import { Message } from '@app/services/models/message.model';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit, OnDestroy {

  // Needed to subscribe to relevant message from other components.
  private subscription: Subscription = null;

  /**
   * If true, we should obscure UI to avoid user from interacting with it.
   */
  public showObscurer = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private titleService: Title,
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private credentialsService: CredentialsService,
    private media: MediaObserver
  ) { }

  ngOnInit() {

    // Making sure we subscribe to relevant messages published by other components.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      switch(msg.name) {

        case 'magic.app.obscurer.show':
          this.showObscurer = true;
          break;

        case 'magic.app.obscurer.hide':
          this.showObscurer = false;
          break;
      }
    })
  }

  ngOnDestroy() {

    // Cleaning up.
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  logout() {
    this.authenticationService.logout().subscribe(() => this.router.navigate(['/login'], { replaceUrl: true }));
  }

  get username(): string | null {
    const credentials = this.credentialsService.credentials;
    return credentials ? credentials.username : null;
  }

  get isMobile(): boolean {
    return this.media.isActive('xs') || this.media.isActive('sm');
  }

  get title(): string {
    return this.titleService.getTitle();
  }
}
