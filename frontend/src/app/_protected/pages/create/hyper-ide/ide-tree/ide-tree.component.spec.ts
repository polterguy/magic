import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeTreeComponent } from './ide-tree.component';

describe('IdeTreeComponent', () => {
  let component: IdeTreeComponent;
  let fixture: ComponentFixture<IdeTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdeTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
