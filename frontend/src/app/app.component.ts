
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Event, RouterEvent, Router, NavigationStart } from '@angular/router';
import { Subject, BehaviorSubject, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterContentChecked {
  title = 'Aista Magic Cloud';

  loading$: Subject<any> = new BehaviorSubject(true);
  constructor(
    // public loader: GeneralService,
    private cdr: ChangeDetectorRef,
    private router: Router) {

    /*
     * Structure for handling referral url to be redirected to sign-up page with referrer's name as a query parameter
     */
    router.events.pipe(
      filter((e: Event): e is RouterEvent => e instanceof RouterEvent)
    ).subscribe((e: RouterEvent) => {
      if (e instanceof NavigationStart) {
        if (e.url.includes('/r/')) {
          const param: string = e.url.split("/").pop();
          this.router.navigateByUrl('/authentication/sign-up?ref=' + param);
        }
      }
    });
  }

  ngAfterContentChecked(): void {
    // this.loader.loading$.subscribe((res: any) => {
    //   this.cdr.markForCheck();
    //   this.loading$.next(res)
    //   this.cdr.detectChanges();
    // })
  }
}
