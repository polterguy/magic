import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTaskComponent } from './schedule-task.component';

describe('ScheduleTaskComponent', () => {
  let component: ScheduleTaskComponent;
  let fixture: ComponentFixture<ScheduleTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleTaskComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
