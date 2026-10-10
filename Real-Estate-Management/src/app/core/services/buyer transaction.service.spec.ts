import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { environment } from 'src/environments/environment';

describe('BuyerTransactionService', () => {
  let service: BuyerTransactionService;
  let httpMock: HttpTestingController;

  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [BuyerTransactionService]
    });
    service  = TestBed.inject(BuyerTransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── APPOINTMENTS ──────────────────────────────────────────────────────────

  describe('bookAppointment()', () => {
    it('should POST to /properties/:id/appointments with visitDate body', () => {
      service.bookAppointment({ propertyId: 1, visitDate: '2026-07-01' }).subscribe();

      const req = httpMock.expectOne(`${base}/properties/1/appointments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ visitDate: '2026-07-01' });
      req.flush({});
    });
  });

  describe('getAgentAppointments()', () => {
    it('should GET /appointments and return list', () => {
      service.getAgentAppointments().subscribe(data => expect(data.length).toBe(1));

      const req = httpMock.expectOne(`${base}/appointments`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([{ id: 1 }]);
    });
  });

  describe('getBookedSlots()', () => {
    it('should GET /properties/:id/booked-slots and return slot list', () => {
      service.getBookedSlots(3).subscribe(slots => expect(slots).toEqual(['2026-07-01']));

      const req = httpMock.expectOne(`${base}/properties/3/booked-slots`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush(['2026-07-01']);
    });
  });

  describe('getBuyerAppointments()', () => {
    it('should GET /appointments?buyerId=:id', () => {
      service.getBuyerAppointments(5).subscribe();

      const req = httpMock.expectOne(`${base}/appointments?buyerId=5`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([]);
    });
  });

  describe('updateAppointmentStatus()', () => {
    it('should PUT /appointments/:id/status with status body', () => {
      service.updateAppointmentStatus(7, 'confirmed').subscribe();

      const req = httpMock.expectOne(`${base}/appointments/7/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'confirmed' });
      req.flush({});
    });
  });

  // ─── OFFERS ────────────────────────────────────────────────────────────────

  describe('makeOffer()', () => {
    it('should POST to /properties/:id/offers with amount and message when provided', () => {
      service.makeOffer({ propertyId: 2, offerAmount: 300000, message: 'Interested' }).subscribe();

      const req = httpMock.expectOne(`${base}/properties/2/offers`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ offerAmount: 300000, message: 'Interested' });
      req.flush({});
    });

    it('should default message to empty string when message is not provided', () => {
      service.makeOffer({ propertyId: 2, offerAmount: 300000 }).subscribe();

      const req = httpMock.expectOne(`${base}/properties/2/offers`);
      expect(req.request.body).toEqual({ offerAmount: 300000, message: '' });
      req.flush({});
    });

    it('should default message to empty string when message is an empty string (falsy)', () => {
      service.makeOffer({ propertyId: 2, offerAmount: 300000, message: '' }).subscribe();

      const req = httpMock.expectOne(`${base}/properties/2/offers`);
      expect(req.request.body).toEqual({ offerAmount: 300000, message: '' });
      req.flush({});
    });
  });

  describe('getPropertyOffers()', () => {
    it('should GET /properties/:id/offers', () => {
      service.getPropertyOffers(4).subscribe();

      const req = httpMock.expectOne(`${base}/properties/4/offers`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([]);
    });
  });

  describe('getBuyerOffers()', () => {
    it('should GET /offers/my', () => {
      service.getBuyerOffers().subscribe();

      const req = httpMock.expectOne(`${base}/offers/my`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([]);
    });
  });

  describe('getAgentOffers()', () => {
    it('should GET /offers', () => {
      service.getAgentOffers().subscribe();

      const req = httpMock.expectOne(`${base}/offers`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([]);
    });
  });

  describe('getBuyerPayments()', () => {
    it('should GET /transactions/my (buyerId param is unused in the URL)', () => {
      service.getBuyerPayments(1).subscribe();

      const req = httpMock.expectOne(`${base}/transactions/my`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([]);
    });
  });

  describe('updateOfferStatus()', () => {
    it('should PUT /offers/:id/status with status body', () => {
      service.updateOfferStatus(8, 'rejected').subscribe();

      const req = httpMock.expectOne(`${base}/offers/8/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'rejected' });
      req.flush({});
    });
  });

  describe('getOffer()', () => {
    it('should GET /offers/:id', () => {
      service.getOffer(11).subscribe(o => expect((o as any).id).toBe(11));

      const req = httpMock.expectOne(`${base}/offers/11`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush({ id: 11 });
    });
  });

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────

  describe('createTransaction()', () => {
    it('should POST /transactions with required fields', () => {
      const payload = { propertyId: 1, sellerId: 2, amount: 500000 };
      service.createTransaction(payload).subscribe();

      const req = httpMock.expectOne(`${base}/transactions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 55 });
    });

    it('should POST /transactions with all optional fields when provided', () => {
      const payload = {
        propertyId:    1,
        sellerId:      2,
        amount:        500000,
        offerId:       10,
        paymentMethod: 'credit_card'
      };
      service.createTransaction(payload).subscribe();

      const req = httpMock.expectOne(`${base}/transactions`);
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 56 });
    });
  });

  describe('getTransaction()', () => {
    it('should GET /transactions/:id', () => {
      service.getTransaction(55).subscribe(t => expect((t as any).id).toBe(55));

      const req = httpMock.expectOne(`${base}/transactions/55`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush({ id: 55 });
    });
  });

  describe('updateTransactionStatus()', () => {
    it('should PUT /transactions/:id/status with status body', () => {
      service.updateTransactionStatus(55, 'completed').subscribe();

      const req = httpMock.expectOne(`${base}/transactions/55/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'completed' });
      req.flush({});
    });
  });

  // ─── PROPERTY STATUS ───────────────────────────────────────────────────────

  describe('updatePropertyStatus()', () => {
    it('should PUT /properties/:id/mark-sold with empty body', () => {
      service.updatePropertyStatus(3).subscribe();

      const req = httpMock.expectOne(`${base}/properties/3/mark-sold`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({});
    });
  });

  describe('getAgentTransactions()', () => {
    it('should GET /transactions/agent (agentId param is unused in the URL)', () => {
      service.getAgentTransactions(1).subscribe();

      const req = httpMock.expectOne(`${base}/transactions/agent`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush([]);
    });
  });

  // ─── EMAIL ─────────────────────────────────────────────────────────────────

  describe('sendEmail()', () => {
    it('should POST /notifications/email with full payload', () => {
      const payload = { to: 'a@b.com', subject: 'Hi', body: 'Hello' };
      service.sendEmail(payload).subscribe();

      const req = httpMock.expectOne(`${base}/notifications/email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });
  });

});