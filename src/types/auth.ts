import type { User, Session } from "@supabase/supabase-js";
import type { UserRow } from "./database";

export type { User, Session };

export interface AuthUser extends UserRow {
  auth: User;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}
