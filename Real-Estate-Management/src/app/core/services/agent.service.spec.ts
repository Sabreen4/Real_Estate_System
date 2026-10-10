import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AgentService } from 'src/app/core/services/agent.service';
import { environment } from 'src/environments/environment';
import { Appointment } from 'src/app/core/models/appointment.model';
import { Offer } from 'src/app/core/models/offer.model';
import { Property } from 'src/app/core/models/property.model';
import { User } from 'src/app/core/models/user.model';

describe('AgentService', () => {
  let service: AgentService;
  let httpMock: HttpTestingController;

  const gateway = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [AgentService]
    });
    service  = TestBed.inject(AgentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── getAppointments ──────────────────────────────────────────────────────

  describe('getAppointments()', () => {

    it('should GET /appointments and return the list', () => {
      const mock: Partial<Appointment>[] = [{ id: 1, status: 'pending' } as any];

      service.getAppointments().subscribe(data => expect(data).toEqual(mock as Appointment[]));

      const req = httpMock.expectOne(`${gateway}/appointments`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush(mock);
    });

    it('should return an empty array when there are no appointments', () => {
      service.getAppointments().subscribe(data => expect(data).toEqual([]));

      const req = httpMock.expectOne(`${gateway}/appointments`);
      req.flush([]);
    });

  });

  // ─── updateAppointment ────────────────────────────────────────────────────

  describe('updateAppointment()', () => {

    it('should PUT /appointments/:id/status with a status body and return the updated appointment', () => {
      const mockResponse: Partial<Appointment> = { id: 2, status: 'confirmed' } as any;

      service.updateAppointment(2, 'confirmed').subscribe(res =>
        expect(res).toEqual(mockResponse as Appointment)
      );

      const req = httpMock.expectOne(`${gateway}/appointments/2/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'confirmed' });
      req.flush(mockResponse);
    });

    it('should correctly interpolate id=0 into the URL', () => {
      service.updateAppointment(0, 'cancelled').subscribe();

      const req = httpMock.expectOne(`${gateway}/appointments/0/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'cancelled' });
      req.flush({});
    });

  });

  // ─── getOffers ────────────────────────────────────────────────────────────

  describe('getOffers()', () => {

    it('should GET /offers and return the list', () => {
      const mock: Partial<Offer>[] = [{ id: 10, offerAmount: 50000 } as any];

      service.getOffers().subscribe(data => expect(data).toEqual(mock as Offer[]));

      const req = httpMock.expectOne(`${gateway}/offers`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush(mock);
    });

    it('should return an empty array when there are no offers', () => {
      service.getOffers().subscribe(data => expect(data).toEqual([]));

      const req = httpMock.expectOne(`${gateway}/offers`);
      req.flush([]);
    });

  });

  // ─── updateOffer ──────────────────────────────────────────────────────────

  describe('updateOffer()', () => {

    it('should PUT /offers/:id/status with a status body and return the updated offer', () => {
      const mockResponse: Partial<Offer> = { id: 5, status: 'accepted' } as any;

      service.updateOffer(5, 'accepted').subscribe(res =>
        expect(res).toEqual(mockResponse as Offer)
      );

      const req = httpMock.expectOne(`${gateway}/offers/5/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'accepted' });
      req.flush(mockResponse);
    });

    it('should correctly interpolate id=0 into the URL', () => {
      service.updateOffer(0, 'rejected').subscribe();

      const req = httpMock.expectOne(`${gateway}/offers/0/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'rejected' });
      req.flush({});
    });

  });

  // ─── getUser ──────────────────────────────────────────────────────────────

  describe('getUser()', () => {

    it('should GET /users/:id and return the user', () => {
      const mock: Partial<User> = { id: 11 } as any;

      service.getUser(11).subscribe(res => expect(res.id).toBe(11));

      const req = httpMock.expectOne(`${gateway}/users/11`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush(mock);
    });

    it('should correctly interpolate id=0 into the URL', () => {
      service.getUser(0).subscribe();

      const req = httpMock.expectOne(`${gateway}/users/0`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 0 });
    });

  });

  // ─── getProperty ──────────────────────────────────────────────────────────

  describe('getProperty()', () => {

    it('should GET /properties/:id and return the property', () => {
      const mock: Partial<Property> = { id: 20 } as any;

      service.getProperty(20).subscribe(res => expect(res.id).toBe(20));

      const req = httpMock.expectOne(`${gateway}/properties/20`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush(mock);
    });

    it('should correctly interpolate id=0 into the URL', () => {
      service.getProperty(0).subscribe();

      const req = httpMock.expectOne(`${gateway}/properties/0`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 0 });
    });

  });

});