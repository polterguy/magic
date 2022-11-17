import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedTopBarComponent } from './shared-top-bar.component';

describe('SharedTopBarComponent', () => {
  let component: SharedTopBarComponent;
  let fixture: ComponentFixture<SharedTopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SharedTopBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedTopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
