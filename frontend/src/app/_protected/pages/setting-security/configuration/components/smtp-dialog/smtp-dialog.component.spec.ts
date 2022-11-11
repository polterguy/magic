import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmtpDialogComponent } from './smtp-dialog.component';

describe('SmtpDialogComponent', () => {
  let component: SmtpDialogComponent;
  let fixture: ComponentFixture<SmtpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SmtpDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmtpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
