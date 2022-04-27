import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraInfoDialogComponent } from './extra-info-dialog.component';

describe('ExtraInfoDialogComponent', () => {
  let component: ExtraInfoDialogComponent;
  let fixture: ComponentFixture<ExtraInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtraInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
