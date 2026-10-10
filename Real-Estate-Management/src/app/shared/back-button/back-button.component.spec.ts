import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { BackButtonComponent } from './back-button.component';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let mockLocation: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    mockLocation = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      declarations: [BackButtonComponent],
      providers: [
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('goBack() should call location.back()', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('goBack() should call location.back() exactly once', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalledTimes(1);
  });
});