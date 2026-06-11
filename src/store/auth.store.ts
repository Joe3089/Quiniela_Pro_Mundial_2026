import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { AuthState, AuthUser } from "@/types/auth";
import type { Session } from "@supabase/supabase-js";

interface AuthStore extends AuthState {
  /** True after the first onAuthStateChange event fires — guarantees real session is known */
  isInitialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
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
        isInitialized: false,
        setUser: (user) =>
          set({ user, isAuthenticated: !!user }, false, "auth/setUser"),
        setSession: (session) =>
          set({ session }, false, "auth/setSession"),
        setLoading: (isLoading) =>
          set({ isLoading }, false, "auth/setLoading"),
        setInitialized: () =>
          set({ isInitialized: true }, false, "auth/setInitialized"),
        reset: () => set({ ...initialState, isInitialized: true }, false, "auth/reset"),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.isAuthenticated = !!state.user;
            state.isLoading = false;
            // isInitialized stays false until onAuthStateChange fires
          }
        },
      }
    ),
    { name: "AuthStore" }
  )
);
