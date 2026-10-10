import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AgentAppointmentsPageComponent } from './appointments-page.component';

describe('AgentAppointmentsPageComponent', () => {
  let component: AgentAppointmentsPageComponent;
  let fixture: ComponentFixture<AgentAppointmentsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgentAppointmentsPageComponent],
      schemas: [NO_ERRORS_SCHEMA]  
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentAppointmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});