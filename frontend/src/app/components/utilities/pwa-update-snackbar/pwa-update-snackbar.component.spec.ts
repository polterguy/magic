import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaUpdateSnackbarComponent } from './pwa-update-snackbar.component';

describe('PwaUpdateSnackbarComponent', () => {
  let component: PwaUpdateSnackbarComponent;
  let fixture: ComponentFixture<PwaUpdateSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PwaUpdateSnackbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PwaUpdateSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
