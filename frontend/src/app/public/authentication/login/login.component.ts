
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { Validators, UntypedFormBuilder } from '@angular/forms';
import { MatAutocompleteActivatedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { BackendsStorageService } from 'src/app/_general/services/backendsstorage.service';

/**
 * Login component allowing user to authenticat towards the backend.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  private backendList: Backend[] = [];

  loginForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    backend: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
  });

  viewPassword: boolean = false;
  waiting: boolean = false;
  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private generalService: GeneralService,
    private backendService: BackendService,
    private router: Router,
    public backendStorageService: BackendsStorageService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.waitForBackend();
  }

  private waitForBackend() {
    this.backendList = this.backendService.backends;

    this.activatedRoute.queryParams.subscribe((params: any) => {
      if (params.switchTo) {
        this.loginForm.controls.backend.setValue(params.switchTo);
        const defaultBackend: Backend = this.backendList.find((item: any) => item.url === params.switchTo);
        if (defaultBackend) {
          this.loginForm.controls.username.setValue(defaultBackend.username);
          this.loginForm.controls.password.setValue(defaultBackend.password);
        }
      } else if (params.backend) {
        this.loginForm.controls.backend.setValue(params.backend);
        const defaultBackend: Backend = this.backendList.find((item: any) => item.url === params.backend.url);
        if (defaultBackend) {
          this.loginForm.controls.username.setValue(defaultBackend.username);
          this.loginForm.controls.password.setValue(defaultBackend.password);
        }
      } else if (this.backendList.length > 0) {
        const defaultBackend: Backend = this.backendList[0];
        this.loginForm.controls.backend.setValue(defaultBackend.url);
        this.loginForm.controls.username.setValue(defaultBackend.username);
        this.loginForm.controls.password.setValue(defaultBackend.password);
      }
    })
  }

  backendActivated(e: MatAutocompleteActivatedEvent) {
    const defaultBackend: Backend = this.backendList.find((item: any) => item.url === e.option.value);
    this.loginForm.controls.username.setValue(defaultBackend.username);
    if (defaultBackend.password) {
      this.loginForm.controls.password.setValue(defaultBackend.password);
    }
  }

  login() {
    if (!CommonRegEx.backend.test(this.loginForm.controls.backend.value.replace(/\/$/, ''))) {
      this.generalService.showFeedback('Backend URL is not valid', 'errorMessage', 'Ok');
      return;
    }

    this.waiting = true;

    /*
     * Storing currently selected backend.
     * Notice, this has to be done before we authenticate, since
     * the auth service depends upon user already having selected
     * a current backend.
     */
    const backend = new Backend(this.loginForm.controls.backend.value.replace(/\/$/, ''), this.loginForm.value.username, this.loginForm.value.password)
    this.backendService.upsert(backend);
    this.backendService.activate(backend);
    this.backendService.login(
      this.loginForm.value.username,
      this.loginForm.value.password,
      true).subscribe({
        next: () => {
          this.router.navigate(['/']);
          setTimeout(() => {
            this.waiting = false;
          }, 1000);
        },
        error: (error: any) => {
          this.generalService.showFeedback(error?.error?.message ?? error ?? 'Something went wrong while trying to login', 'errorMessage', 'Ok');
          this.waiting = false;
        }
      });
  }
}
