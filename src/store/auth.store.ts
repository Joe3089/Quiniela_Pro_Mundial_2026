import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { AuthState, AuthUser } from "@/types/auth";
import type { Session } from "@supabase/supabase-js";

interface AuthStore extends AuthState {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setUser: (user) =>
          set({ user, isAuthenticated: !!user }, false, "auth/setUser"),
        setSession: (session) =>
          set({ session }, false, "auth/setSession"),
        setLoading: (isLoading) =>
          set({ isLoading }, false, "auth/setLoading"),
        reset: () => set(initialState, false, "auth/reset"),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.isAuthenticated = !!state.user;
            state.isLoading = false;
          }
        },
      }
    ),
    { name: "AuthStore" }
  )
);
