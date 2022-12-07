import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';

import { GeneralService } from 'src/app/_general/services/general.service';
import { SetupModel } from '../../models/common/status.model';
import { ConfigService } from '../setting-security/configuration/_services/config.service';

class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidCtrl = !!(control?.invalid && control?.parent?.dirty);
    const invalidParent = !!(control?.parent?.invalid && control?.parent?.dirty);
   return invalidCtrl || invalidParent;
  }
}

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  matcher = new MyErrorStateMatcher();

  databaseTypes: any[] = [
    {name: 'SQLite', value: 'sqlite'},
    {name: 'MySQL', value: 'mysql'},
    {name: 'PostgreSQL', value: 'pgsql'},
    {name: 'SQL Server', value: 'mssql'},
  ];

  checkPasswords: ValidatorFn = (g: AbstractControl):  ValidationErrors | null => {
    const pass = g.get('password')?.value;
    const confirmPass = g.get('passwordRepeat')?.value;
    return pass === confirmPass ? null : { notSame: true }
  }

  configForm = this.formBuilder.group({
    connectionString: ['Data Source=files/data/{database}.db', [Validators.required, Validators.pattern('.*{database}.*')]],
    defaultTimeZone: ['none', [Validators.required]],
    selectedDatabaseType: ['sqlite', [Validators.required]],
    password: ['', [Validators.required, Validators.pattern('.{12,}')]],
    passwordRepeat: [''],
    name: ['', [Validators.required]],
    email: ['', [Validators.required]],
  });

  showPassword: boolean = false;

  public waiting: boolean = false;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  constructor(
    private formBuilder: FormBuilder,
    private configService: ConfigService,
    private generalService: GeneralService,
    private router: Router) {
    this.configForm.addValidators(this.checkPasswords);
  }

  ngOnInit() : void {
    this.configForm.controls.password.valueChanges.subscribe(() => {
      if (this.showPassword) {
        this.configForm.controls.passwordRepeat.setValue(this.configForm.controls.password.value);
      }
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    if (this.showPassword) {
      this.configForm.controls.passwordRepeat.setValue(this.configForm.controls.password.value);
      this.configForm.controls.passwordRepeat.disable();
    } else {
      this.configForm.controls.passwordRepeat.enable();
    }
  }

  selectedDatabaseTypeChanged() {
    switch (this.configForm.controls.selectedDatabaseType.value) {

      case 'sqlite':
        this.configForm.controls.connectionString.setValue('Data Source=files/data/{database}.db');
        break;

      case 'mysql':
        this.configForm.controls.connectionString.setValue('Server=localhost;Database={database};Uid=root;Pwd=ThisIsNotAGoodPassword;SslMode=Preferred;Old Guids=true;');
        break;

      case 'pgsql':
        this.configForm.controls.connectionString.setValue('User ID=postgres;Password=ThisIsNotAGoodPassword;Host=localhost;Port=5432;Database={database}');
        break;

      case 'mssql':
        this.configForm.controls.connectionString.setValue('Server=localhost\\SQLEXPRESS;Database={database};Trusted_Connection=True;');
        break;
    }
  }

  submit() {
    if (this.configForm.invalid) {
      this.generalService.showFeedback('Please fill all the fields.', 'errorMessage');
      return;
    }
    this.generalService.showLoading();
    this.waiting = true;
    const payload: SetupModel = {
      password: this.configForm.controls.password.value,
      connectionString: this.configForm.controls.connectionString.value,
      defaultTimeZone: this.configForm.controls.defaultTimeZone.value,
      databaseType: this.configForm.controls.selectedDatabaseType.value,
      name: this.configForm.controls.name.value,
      email: this.configForm.controls.email.value,
    };
    this.configService.setup(payload).subscribe({
      next: (auth: any) => {
        this.waiting = false;
        // this.router.navigateByUrl('/');
        window.location.href = '/';
        this.generalService.hideLoading();
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message??error, 'errorMessage');
        this.generalService.hideLoading();
        this.waiting = false;
      }
    });
  }
}
