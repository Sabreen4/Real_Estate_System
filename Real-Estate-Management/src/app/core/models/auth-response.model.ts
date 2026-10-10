export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  userId: number;
  roleId: number;
  firstName: string;
  lastName: string;
  email: string;
}