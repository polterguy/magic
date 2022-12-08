import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogSearchboxComponent } from './log-searchbox.component';

describe('LogSearchboxComponent', () => {
  let component: LogSearchboxComponent;
  let fixture: ComponentFixture<LogSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
