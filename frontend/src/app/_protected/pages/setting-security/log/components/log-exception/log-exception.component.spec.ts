import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogExceptionComponent } from './log-exception.component';

describe('LogExceptionComponent', () => {
  let component: LogExceptionComponent;
  let fixture: ComponentFixture<LogExceptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogExceptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogExceptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
