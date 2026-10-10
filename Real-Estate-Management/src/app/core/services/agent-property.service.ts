import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Property, PropertyImage } from '../models/property.model';
import { environment } from 'src/environments/environment';

export interface PaginatedProperties {
  items: Property[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgentPropertyService {

  private gatewayUrl = environment.apiUrl;
  private apiUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) { }

  // ─── GET ONLY THIS AGENT'S PROPERTIES ─────────────────────────────────────
  public getAgentProperties(
    agentUserId?: number,
    filters?: {
      location?:     string;
      selectedType?: string;
      listingType?:  string;
      status?:       string;
      minPrice?:     number | null;
      maxPrice?:     number | null;
    } | null,
    page:     number = 1,
    pageSize: number = 10
  ): Observable<PaginatedProperties> {
    let params = new HttpParams();

    if (agentUserId) params = params.set('userId', agentUserId.toString());

    // ── Server-side pagination params ────────────────────────────────────────
    params = params.set('pageNumber', page.toString());
    params = params.set('pageSize',   pageSize.toString());

    // ── Filters ──────────────────────────────────────────────────────────────
    if (filters?.location?.trim()) {
      const city = filters.location.trim()
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      params = params.set('City', city);
    }
    if (filters?.selectedType)     params = params.set('PropertyTypeId', filters.selectedType);
    if (filters?.listingType)      params = params.set('ListingTypeId',  filters.listingType);
    if (filters?.status)           params = params.set('StatusId',       filters.status);
    if (filters?.minPrice != null) params = params.set('MinPrice',       filters.minPrice.toString());
    if (filters?.maxPrice != null) params = params.set('MaxPrice',       filters.maxPrice.toString());

    return this.http.get<PaginatedProperties>(`${this.apiUrl}`, { params });
  }

  // ─── GET SINGLE ───────────────────────────────────────────────────────────
  public getPropertyById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  public createProperty(data: Partial<Property>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, data);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  public updateProperty(id: number, data: Partial<Property>): Observable<Property> {
    const form = new FormData();
    form.append('id',             id.toString());
    form.append('title',          data.title          ?? '');
    form.append('description',    data.description    ?? '');
    form.append('city',           data.city           ?? '');
    form.append('state',          data.state          ?? '');
    form.append('zipCode',        data.zipCode        ?? '');
    form.append('price',          Number(data.price   ?? 0).toString());
    form.append('size',           Number(data.size    ?? 0).toString());
    form.append('propertyTypeId', parseInt(String(data.propertyTypeId), 10).toString());
    form.append('listingTypeId',  parseInt(String(data.listingTypeId),  10).toString());
    form.append('statusId',       parseInt(String(data.statusId),       10).toString());
    return this.http.put<Property>(`${this.apiUrl}/${id}`, form);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  public deleteProperty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ─── UPLOAD IMAGES ────────────────────────────────────────────────────────
  public uploadImages(propertyId: number, files: File[]): Observable<PropertyImage[]> {
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));
    return this.http.post<PropertyImage[]>(`${this.gatewayUrl}/properties/${propertyId}/images`, form);
  }

  // ─── GET IMAGES ───────────────────────────────────────────────────────────
  public getImages(propertyId: number): Observable<PropertyImage[]> {
    return this.http.get<PropertyImage[]>(`${this.gatewayUrl}/properties/${propertyId}/images`);
  }

  // ─── DELETE IMAGES ────────────────────────────────────────────────────────
  public deleteImages(propertyId: number, ids: number[]): Observable<void> {
    return this.http.delete<void>(
      `${this.gatewayUrl}/properties/${propertyId}/images`,
      { body: ids }
    );
  }
}