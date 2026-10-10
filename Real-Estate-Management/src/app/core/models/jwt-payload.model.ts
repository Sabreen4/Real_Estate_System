export interface JwtPayload {
  sub?: string;
  userId?: string;
  nameid?: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
}