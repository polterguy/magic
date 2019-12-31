
import { Component } from '@angular/core';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent {

  private password: string = null;
  private passwordRepeat: string = null;

  save() {
    console.log(this.password + this.passwordRepeat);
    alert('todo');
  }
}
