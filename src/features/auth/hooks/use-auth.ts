"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { createClient } from "@/lib/supabase/client";
import type { LoginCredentials, RegisterCredentials, AuthUser } from "@/types/auth";

export function useLogin() {
  const router = useRouter();
  const { setUser, setSession } = useAuthStore();

  return useMutation({
    mutationFn: (creds: LoginCredentials) => authService.signIn(creds),
    onSuccess: async (data) => {
      if (data.session) {
        setSession(data.session);
        // Eagerly hydrate the store so the dashboard renders with user data immediately
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile) {
          setUser({ ...profile, auth: data.user } as AuthUser);
        }
      }
      toast.success("¡Bienvenido de vuelta!");
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Error al iniciar sesión");
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (creds: RegisterCredentials) => authService.signUp(creds),
    onSuccess: () => {
      toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
      router.push("/auth/verify-email");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Error al registrarse");
    },
  });
}

export function useLogout() {
  const { reset } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      reset();
      router.push("/");
    },
  });
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: () => authService.signInWithGoogle(),
    onError: (error: Error) => {
      const msg = error.message ?? "";
      if (msg.includes("provider is not enabled") || msg.includes("validation_failed")) {
        toast.error("Google OAuth no está activado en Supabase. Actívalo en Authentication → Providers → Google.");
      } else {
        toast.error(msg || "Error al iniciar sesión con Google");
      }
    },
  });
}
