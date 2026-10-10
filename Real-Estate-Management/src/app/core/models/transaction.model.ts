export interface Transaction {
  id: number;
  propertyId: number;
  sellerId: number;
  buyerId?: number;
  amount: number;
  offerId?: number;
  paymentMethod?: string;
  status: string;
  transactionId?: string;
  // Fields returned by the API but not previously declared
  propertyTitle?:        string;
  transactionReference?: string;
  paymentDate?:          string;
}