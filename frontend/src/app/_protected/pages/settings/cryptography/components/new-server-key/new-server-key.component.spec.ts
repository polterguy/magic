import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewServerKeyComponent } from './new-server-key.component';

describe('NewServerKeyComponent', () => {
  let component: NewServerKeyComponent;
  let fixture: ComponentFixture<NewServerKeyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewServerKeyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewServerKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
