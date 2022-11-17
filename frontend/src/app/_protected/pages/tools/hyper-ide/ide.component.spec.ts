import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeComponent } from './ide.component';

describe('IdeComponent', () => {
  let component: IdeComponent;
  let fixture: ComponentFixture<IdeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
