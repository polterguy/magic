
import { Component, OnInit } from '@angular/core';
import { LoginComponent } from './login/login.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  ngOnInit(): void {
  }

  shouldRenderLogin() {
    return true;
  }

  shouldRenderRouterOutlet() {
    return false;
  }
}
