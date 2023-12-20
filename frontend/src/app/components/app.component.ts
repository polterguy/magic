
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { GeneralService } from 'src/app/services/general.service';
import { ThemeService } from '../services/theme.service';

/**
 * Primary component for application, encapsulating progress bar, and router outlet.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterContentChecked {

  loading$: Subject<any> = new BehaviorSubject(true);

  constructor(
    private generalService: GeneralService,
    private themeService: ThemeService, // Required even though never used to ensure theme is injected
    private cdr: ChangeDetectorRef) { }

  ngAfterContentChecked() {

    this.generalService.loading$.subscribe((res: any) => {

      this.cdr.markForCheck();
      this.loading$.next(res)
      this.cdr.detectChanges();
    });
  }
}
