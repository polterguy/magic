import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortkeysComponent } from './shortkeys.component';

describe('ShortkeysComponent', () => {
  let component: ShortkeysComponent;
  let fixture: ComponentFixture<ShortkeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShortkeysComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShortkeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
