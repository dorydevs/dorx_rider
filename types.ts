export type UserRole = 'Hub' | 'Provincial Office' | 'Regional Office';

export type User = {
  username: string;
  operationAccountType: string;
  phone: string;
  barangay: string;
  city: string;
  province: string;
  token?: string;
  id?: number;
  region?: string;
};
