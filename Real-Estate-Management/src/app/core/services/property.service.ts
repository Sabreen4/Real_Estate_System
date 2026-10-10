import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Property } from '../models/property.model';
import { environment } from 'src/environments/environment';

export interface PropertyFilters {
  city?:           string;
  propertyTypeId?: string;
  listingTypeId?:  string;
  minPrice?:       number | null;
  maxPrice?:       number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  private apiUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) {}

  public getProperties(filters: PropertyFilters): Observable<Property[]> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof PropertyFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<Property[]>(this.apiUrl, { params });
  }
}