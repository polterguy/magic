import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaUpdateDialogComponent } from './pwa-update-dialog.component';

describe('PwaUpdateDialogComponent', () => {
  let component: PwaUpdateDialogComponent;
  let fixture: ComponentFixture<PwaUpdateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PwaUpdateDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PwaUpdateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
