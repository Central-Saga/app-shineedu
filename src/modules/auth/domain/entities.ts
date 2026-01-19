export interface RolePermission {
  id: number;
  name: string;
}

export interface UserRole {
  id: number;
  name: string;
  permissions?: RolePermission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  roles?: UserRole[];
  email_verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
  token_type: string;
  expires_at?: string | null;
}
