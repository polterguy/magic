
import { Component, OnInit } from '@angular/core';
import { LoginService } from '../services/login-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public username: string;
  public password: string;

  constructor(private service: LoginService) { }

  ngOnInit() {
  }

  login() {
    this.service.login(this.username, this.password).subscribe((result) => {
      console.log(result);
    });
    return false;
  }
}
