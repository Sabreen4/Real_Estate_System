export interface User {
  id: number;
  firstName: string;   // optional
  lastName: string;    // optional
  email: string;       // optional
  phone: string;       // optional
  roleId?: number;
  roleName?: string;
}