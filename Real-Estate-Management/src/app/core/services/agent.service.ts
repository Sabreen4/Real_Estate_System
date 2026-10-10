import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Appointment } from '../models/appointment.model';
import { Offer } from '../models/offer.model';
import { Property } from '../models/property.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {

  private gateway = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── APPOINTMENTS ─────────────────────
  public getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.gateway}/appointments`);
  }

  public updateAppointment(id: number, status: string): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.gateway}/appointments/${id}/status`,
      { status }
    );
  }

  // ── OFFERS ───────────────────────────
  public getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.gateway}/offers`);
  }

  public updateOffer(id: number, status: string): Observable<Offer> {
    return this.http.put<Offer>(
      `${this.gateway}/offers/${id}/status`,
      { status }
    );
  }

  // ── USERS ────────────────────────────
  public getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.gateway}/users/${id}`);
  }

  // ── PROPERTIES ───────────────────────
  public getProperty(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.gateway}/properties/${id}`);
  }
}