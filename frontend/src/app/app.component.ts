
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { GeneralService } from './_general/services/general.service';
import { ThemeService } from './_general/services/theme.service';

/**
 * Primary component for dashboard, encapsulating progress bar, and router outlet.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterContentChecked {
  title = 'Aista Magic Cloud';

  loading$: Subject<any> = new BehaviorSubject(true);

  /**
   *
   * @param loader To handle the loader generally.
   * @param cdr To detect changes for handling the loader.
   */
  constructor(
    private generalService: GeneralService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef) {
  }

  ngAfterContentChecked(): void {
    this.generalService.loading$.subscribe((res: any) => {
      this.cdr.markForCheck();
      this.loading$.next(res)
      this.cdr.detectChanges();
    })
  }
}
