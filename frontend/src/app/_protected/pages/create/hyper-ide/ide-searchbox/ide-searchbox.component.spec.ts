import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeSearchboxComponent } from './ide-searchbox.component';

describe('IdeSearchboxComponent', () => {
  let component: IdeSearchboxComponent;
  let fixture: ComponentFixture<IdeSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdeSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
