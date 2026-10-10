import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Appointment } from '../models/appointment.model';
import { Offer } from '../models/offer.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class BuyerTransactionService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ───────────────── APPOINTMENTS ─────────────────

  public bookAppointment(payload: {
    propertyId: number;
    visitDate: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(
      `${this.base}/properties/${payload.propertyId}/appointments`,
      { visitDate: payload.visitDate }
    );
  }

  public getAgentAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/appointments`);
  }

  public getBookedSlots(propertyId: number): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.base}/properties/${propertyId}/booked-slots`
    );
  }

  public getBuyerAppointments(buyerId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `${this.base}/appointments?buyerId=${buyerId}`
    );
  }

  public updateAppointmentStatus(id: number, status: string): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.base}/appointments/${id}/status`,
      { status }
    );
  }

  // ───────────────── OFFERS ─────────────────

  public makeOffer(payload: {
    propertyId: number;
    offerAmount: number;
    message?: string;
  }): Observable<Offer> {
    return this.http.post<Offer>(
      `${this.base}/properties/${payload.propertyId}/offers`,
      {
        offerAmount: payload.offerAmount,
        message: payload.message || ''
      }
    );
  }

  public getPropertyOffers(propertyId: number): Observable<Offer[]> {
    return this.http.get<Offer[]>(
      `${this.base}/properties/${propertyId}/offers`
    );
  }

  public getBuyerOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.base}/offers/my`);
  }

  public getAgentOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.base}/offers`);
  }

  public getBuyerPayments(buyerId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/transactions/my`);
  }

  public updateOfferStatus(id: number, status: string): Observable<Offer> {
    return this.http.put<Offer>(
      `${this.base}/offers/${id}/status`,
      { status }
    );
  }

  public getOffer(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.base}/offers/${id}`);
  }

  // ───────────────── TRANSACTIONS ─────────────────

  public createTransaction(payload: {
    propertyId: number;
    sellerId: number;
    amount: number;
    offerId?: number;
    paymentMethod?: string;
  }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/transactions`, payload);
  }

  public getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.base}/transactions/${id}`);
  }

  public updateTransactionStatus(id: number, status: string): Observable<Transaction> {
    return this.http.put<Transaction>(
      `${this.base}/transactions/${id}/status`,
      { status }
    );
  }

  // ───────────────── PROPERTY STATUS ─────────────────

  public updatePropertyStatus(propertyId: number): Observable<void> {
    return this.http.put<void>(
      `${this.base}/properties/${propertyId}/mark-sold`,
      {}
    );
  }

  public getAgentTransactions(agentId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/transactions/agent`);
  }

  // ───────────────── EMAIL ─────────────────

  public sendEmail(payload: {
    to: string;
    subject: string;
    body: string;
  }): Observable<void> {
    return this.http.post<void>(
      `${this.base}/notifications/email`,
      payload
    );
  }
}