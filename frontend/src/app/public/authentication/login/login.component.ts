
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';
import { Validators, UntypedFormBuilder, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecaptchaComponent } from 'ng-recaptcha';
import { map, Observable, startWith } from 'rxjs';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  loginForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    backends: ['', [Validators.required]]
  });

  recaptchaKey: string = '';
  backendHasBeenSelected: boolean = false;
  backends = new FormControl<any>('', Validators.pattern(CommonRegEx.backend));
  backendList: any = [];
  filteredBackends: Observable<any[]>;
  savePassword: boolean = false;
  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;
  viewPassword: boolean = false;
  rememberPassword: boolean = false;
  waiting: boolean = false;

  @ViewChild('captchaRef', { static: false }) captchaRef: RecaptchaComponent;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private generalService: GeneralService,
    private backendService: BackendService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    @Inject(Injector) private readonly injector: Injector) { }

  ngOnInit(): void {
    this.readBackendService();
  }

  private readBackendService() {
    (async () => {
      while (!this.backendService?.active?.access && !Object.keys(this.backendService?.active?.access?.auth ?? {}).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService?.active) {
        this.backendHasBeenSelected = true;
        this.backendList = this.backendService.backends;

        this.activatedRoute.queryParams.subscribe((params: any) => {
          if (params.switchTo) {
            const defaultBackend: any = this.backendList.find((item: any) => item.url === params.switchTo)
            this.backends.setValue(defaultBackend);
          }
        })

        if (this.backendList && this.backendList.length && !this.backends.value) {
          const defaultBackend: any = this.backendList.find((item: any) => item.url === this.backendService.active.url)
          this.backends.setValue(defaultBackend);

        }
        this.backendService._activeCaptchaValue.subscribe((key: string) => {
          this.recaptchaKey = key;
        })
        this.watchAutocomplteChanges();
        this.cdr.detectChanges();
      }
      this.cdr.detectChanges();
    })();
  }

  /**
   * Watching changes in the autocomplete list of existing backends.
   */
  private watchAutocomplteChanges() {
    this.filteredBackends = this.backends.valueChanges.pipe(
      startWith(''),
      map((value: any) => {
        this.changeBackend();
        const url = typeof value === 'string' ? value : value?.url;
        return url ? this._filter(url as string) : this.backendList.slice();
      }),
    );
  }

  /**
   * Manages the parameter to display in the textbox.
   * @param backend Selected backend from the list as an object
   * @returns URL of the selected backend to display in the input box.
   */
  displayFn(backend: any): string {
    return backend && backend.url ? backend.url : '';
  }

  /**
   * Filters the list of backends in the autocomplete element.
   * @param keyword Typed value in the input.
   * @returns Filtered list based on the given keyword.
   */
  private _filter(keyword: string) {
    const filterValue = keyword.toLowerCase();
    return this.backendList.filter((option: any) => option.url.toLowerCase().includes(filterValue));
  }

  /**
   * Updates the form based on the selected backend.
   */
  private changeBackend() {
    if (this.backends.value !== 'string' && this.backends.value !== '') {
      this.loginForm.patchValue({
        username: this.backends.value?.username,
        password: this.backends.value?.password,
        backends: this.backends.value.url
      })
    }
  }

  /**
   * login form
   */
  login(inputValue?: string) {

    if (!CommonRegEx.backend.test(inputValue)) {
      this.generalService.showFeedback('Backend URL is not valid.', 'errorMessage', 'Ok');
      return;
    }
    if (inputValue && inputValue !== '' && this.loginForm.value.backends === undefined) {
      this.loginForm.controls.backends.setValue(inputValue)
    }

    this.waiting = true;

    /*
     * Storing currently selected backend.
     * Notice, this has to be done before we authenticate, since
     * the auth service depends upon user already having selected
     * a current backend.
     */
    const backend = new Backend(this.loginForm.value.backends, this.loginForm.value.username, this.loginForm.value.password)
    this.backendService.upsert(backend);
    this.backendService.activate(backend);
    this.backendService.login(
      this.loginForm.value.username,
      this.loginForm.value.password,
      this.savePassword).subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.waiting = false;
        },
        error: (error: any) => {
          this.generalService.showFeedback(error.error.message??error, 'errorMessage', 'Ok');
          this.waiting = false;
        }
      });
  }

  executeRecaptcha() {
    this.captchaRef?.execute();
  }
}
