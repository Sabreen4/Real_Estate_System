export interface Appointment {
  id: number;
  propertyId: number;
  propertyTitle?: string;
  propertyName?: string;   // used in template: a.propertyName
  userId?: number;
  buyerId?: number;        // used in enrichAppointments
  buyerName?: string;      // set by enrichAppointments
  agentId?: number;
  visitDate: string;
  status: string;
  message?: string;        // used in template: a.message
}