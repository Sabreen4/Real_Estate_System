import { Property } from 'src/app/core/models/property.model';

export function emptyPropertyForm(): Partial<Property> {
  return {
    title: '', description: '', city: '', state: '',
    zipCode: '', price: 0, size: 0,
    propertyTypeId: undefined, listingTypeId: undefined, statusId: 100,
  };
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}