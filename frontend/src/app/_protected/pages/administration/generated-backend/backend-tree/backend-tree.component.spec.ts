import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendTreeComponent } from './backend-tree.component';

describe('BackendTreeComponent', () => {
  let component: BackendTreeComponent;
  let fixture: ComponentFixture<BackendTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackendTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackendTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
