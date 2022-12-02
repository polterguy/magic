
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { GeneralService } from './_general/services/general.service';

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
    public loader: GeneralService,
    private cdr: ChangeDetectorRef) {
  }

  ngAfterContentChecked(): void {
    this.loader.loading$.subscribe((res: any) => {
      this.cdr.markForCheck();
      this.loading$.next(res)
      this.cdr.detectChanges();
    })
  }
}
