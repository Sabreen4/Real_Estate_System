import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Property } from 'src/app/core/models/property.model';
import { Offer } from 'src/app/core/models/offer.model';
import { Appointment } from 'src/app/core/models/appointment.model';
import { HttpResponse } from '@angular/common/http';
// ── Typed cache shapes ─────────────────────────────────────────────────────

export interface DashboardCacheData {
  properties:  Property[];
  agentName:   string;
  agentUserId: number;
}

export interface OffersCacheData {
  offers: Offer[];
}

export interface AppointmentsCacheData {
  appointments: Appointment[];
}

// ── Internal entry ─────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data:      T;
  expiresAt: number;
  subject:   ReplaySubject<T>;
}

// ── TTL constants ──────────────────────────────────────────────────────────

const DEFAULT_TTL_MS      = 5 * 60 * 1000;
const DASHBOARD_TTL_MS    = 5 * 60 * 1000;
const OFFERS_TTL_MS       = 5 * 60 * 1000;
const APPOINTMENTS_TTL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class CacheService {

  private store = new Map<string, CacheEntry<unknown>>();

  // ── Generic read/write ────────────────────────────────────────────────────

  get<T>(key: string): Observable<T> | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return (entry.subject as ReplaySubject<T>).asObservable();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  set<T>(key: string, source: Observable<T>, ttlMs = DEFAULT_TTL_MS): Observable<T> {
    const subject = new ReplaySubject<T>(1);

    if (this.store.size >= 100) {
      const firstKey = this.store.keys().next().value!;
      this.store.delete(firstKey);
    }

    const entry: CacheEntry<T> = {
      data:      undefined as unknown as T,
      expiresAt: Date.now() + ttlMs,
      subject,
    };
    this.store.set(key, entry as CacheEntry<unknown>);

    source.pipe(shareReplay(1)).subscribe({
      next: (data) => {
        entry.data = data;
        subject.next(data);
        subject.complete();
      },
      error: (err) => {
        this.store.delete(key);
        subject.error(err);
      },
    });

    return subject.asObservable();
  }

  remember<T>(key: string, fetchFn: () => Observable<T>, ttlMs = DEFAULT_TTL_MS): Observable<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;
    return this.set(key, fetchFn(), ttlMs);
  }

  // ── Invalidation ──────────────────────────────────────────────────────────

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  private dashboardKey(agentUserId: number): string {
    return `dashboard:${agentUserId}`;
  }

  isDashboardValid(agentUserId: number): boolean {
    return this.has(this.dashboardKey(agentUserId));
  }

  getDashboard(agentUserId: number): DashboardCacheData | null {
    const entry = this.store.get(this.dashboardKey(agentUserId));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.dashboardKey(agentUserId));
      return null;
    }
    return entry.data as DashboardCacheData;
  }

  setDashboard(data: DashboardCacheData): void {
    const key     = this.dashboardKey(data.agentUserId);
    const subject = new ReplaySubject<DashboardCacheData>(1);
    const entry: CacheEntry<DashboardCacheData> = {
      data:      { ...data, properties: [...data.properties] },
      expiresAt: Date.now() + DASHBOARD_TTL_MS,
      subject,
    };
    subject.next(entry.data);
    subject.complete();
    this.store.set(key, entry as CacheEntry<unknown>);
    console.debug('[Cache SET] dashboard:', key);
  }

  clearDashboard(agentUserId: number): void {
    this.store.delete(this.dashboardKey(agentUserId));
  }

  // ── Offers ────────────────────────────────────────────────────────────────

  private readonly OFFERS_KEY = 'offers';

  isOffersValid(): boolean {
    return this.has(this.OFFERS_KEY);
  }

  getOffers(): Offer[] | null {
    const entry = this.store.get(this.OFFERS_KEY);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.OFFERS_KEY);
      return null;
    }
    return (entry.data as OffersCacheData).offers;
  }

  setOffers(offers: Offer[]): void {
    const subject = new ReplaySubject<OffersCacheData>(1);
    const data: OffersCacheData = { offers: [...offers] };
    const entry: CacheEntry<OffersCacheData> = {
      data:      data,
      expiresAt: Date.now() + OFFERS_TTL_MS,
      subject,
    };
    subject.next(data);
    subject.complete();
    this.store.set(this.OFFERS_KEY, entry as CacheEntry<unknown>);
    console.debug('[Cache SET] offers');
  }

  clearOffers(): void {
    this.store.delete(this.OFFERS_KEY);
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  private readonly APPOINTMENTS_KEY = 'appointments';

  isAppointmentsValid(): boolean {
    return this.has(this.APPOINTMENTS_KEY);
  }

  getAppointments(): Appointment[] | null {
    const entry = this.store.get(this.APPOINTMENTS_KEY);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.APPOINTMENTS_KEY);
      return null;
    }
    return (entry.data as AppointmentsCacheData).appointments;
  }

  setAppointments(appointments: Appointment[]): void {
    const subject = new ReplaySubject<AppointmentsCacheData>(1);
    const data: AppointmentsCacheData = { appointments: [...appointments] };
    const entry: CacheEntry<AppointmentsCacheData> = {
      data:      data,
      expiresAt: Date.now() + APPOINTMENTS_TTL_MS,
      subject,
    };
    subject.next(data);
    subject.complete();
    this.store.set(this.APPOINTMENTS_KEY, entry as CacheEntry<unknown>);
    console.debug('[Cache SET] appointments');
  }

  clearAppointments(): void {
    this.store.delete(this.APPOINTMENTS_KEY);
  }
  // Add these two methods to CacheService, after the existing generic methods

/** Store a raw HttpResponse for HTTP-level caching. */
setRawResponse(key: string, response: HttpResponse<unknown>, ttlMs: number): void {
  const subject = new ReplaySubject<HttpResponse<unknown>>(1);
  const entry: CacheEntry<HttpResponse<unknown>> = {
    data:      response,
    expiresAt: Date.now() + ttlMs,
    subject,
  };
  subject.next(response);
  subject.complete();
  this.store.set(key, entry as CacheEntry<unknown>);
}

/** Retrieve a raw HttpResponse if still valid, or null. */
getRawResponse(key: string): HttpResponse<unknown> | null {
  const entry = this.store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    this.store.delete(key);
    return null;
  }
  if (entry.data instanceof HttpResponse) {
    return entry.data as HttpResponse<unknown>;
  }
  return null;
}
}