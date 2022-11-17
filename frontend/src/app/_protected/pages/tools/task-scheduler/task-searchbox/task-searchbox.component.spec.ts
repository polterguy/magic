import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskSearchboxComponent } from './task-searchbox.component';

describe('TaskSearchboxComponent', () => {
  let component: TaskSearchboxComponent;
  let fixture: ComponentFixture<TaskSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaskSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
