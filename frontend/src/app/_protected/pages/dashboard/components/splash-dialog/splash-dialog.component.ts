import { Component } from '@angular/core';
import { ThemeService } from 'src/app/_general/services/theme.service';

@Component({
  selector: 'app-splash-dialog',
  templateUrl: './splash-dialog.component.html'
})
export class SplashDialogComponent {

  constructor(public themeService: ThemeService) { }
}
