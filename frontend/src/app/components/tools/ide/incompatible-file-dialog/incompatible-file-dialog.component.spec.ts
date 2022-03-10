import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncompatibleFileDialogComponent } from './incompatible-file-dialog.component';

describe('IncompatibleFileDialogComponent', () => {
  let component: IncompatibleFileDialogComponent;
  let fixture: ComponentFixture<IncompatibleFileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IncompatibleFileDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IncompatibleFileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
