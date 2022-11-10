import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestHealthContentDialogComponent } from './test-health-content-dialog.component';

describe('TestHealthContentDialogComponent', () => {
  let component: TestHealthContentDialogComponent;
  let fixture: ComponentFixture<TestHealthContentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestHealthContentDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHealthContentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
