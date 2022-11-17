import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPluginComponent } from './view-plugin.component';

describe('ViewPluginComponent', () => {
  let component: ViewPluginComponent;
  let fixture: ComponentFixture<ViewPluginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewPluginComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPluginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
