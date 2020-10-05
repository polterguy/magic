// Angular imports.
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { HttpService } from '../../services/http-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private authService: AuthService,
    private httpService: HttpService)
  { }

  public authenticate() {
    this.authService.me.authenticate('root', 'admin').subscribe(res => {
      // Uncomment to test your JWT ticket towards backend (Sakila database).
      /*this.httpService.actor.read({}).subscribe(x => {
        console.log(x);
      });*/
    });
  }

  public logout() {
    this.authService.me.logout();
  }
}
