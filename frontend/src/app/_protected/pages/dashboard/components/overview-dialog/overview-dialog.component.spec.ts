import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewDialogComponent } from './overview-dialog.component';

describe('OverviewDialogComponent', () => {
  let component: OverviewDialogComponent;
  let fixture: ComponentFixture<OverviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverviewDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
