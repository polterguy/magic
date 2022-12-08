import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogNameComponent } from './catalog-name.component';

describe('CatalogNameComponent', () => {
  let component: CatalogNameComponent;
  let fixture: ComponentFixture<CatalogNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CatalogNameComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
