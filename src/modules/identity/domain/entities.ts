export interface RolePermission {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions?: RolePermission[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Permission {
  id: number;
  name: string;
  guard_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IdentityUserRole {
  id: number;
  name: string;
}

export interface IdentityUser {
  id: number;
  name: string;
  email: string;
  status: string;
  roles?: IdentityUserRole[];
  created_at?: string | null;
  updated_at?: string | null;
}
