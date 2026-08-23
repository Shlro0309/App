export type UserRole = "ADMIN" | "EMPLOYEE" | "CUSTOMER";

export type CurrentUser = {
  userId: number;
  customerId: number | null;
  employeeId: number | null;
  username: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  status: string;
  balance: number | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMinutes: number;
  user: CurrentUser;
};

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
};

export type LoginValues = {
  username: string;
  password: string;
  clientType?: string;
};
