import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkTableComponent } from './link-table.component';

describe('LinkTableComponent', () => {
  let component: LinkTableComponent;
  let fixture: ComponentFixture<LinkTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinkTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
