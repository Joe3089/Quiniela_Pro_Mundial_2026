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
      if (data.session && data.user) {
        setSession(data.session);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = createClient() as any;

        // Fetch existing profile
        let { data: profile } = await db
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        // If no profile row yet, create it so setUser always fires
        if (!profile) {
          const meta = data.user.user_metadata ?? {};
          const fallbackUsername = (data.user.email ?? "")
            .split("@")[0]
            .replace(/[^a-z0-9_]/gi, "_")
            .toLowerCase();
          const { data: newProfile } = await db
            .from("users")
            .upsert(
              {
                id: data.user.id,
                email: data.user.email ?? "",
                display_name: meta.full_name ?? meta.display_name ?? null,
                username: meta.username ?? fallbackUsername,
                avatar_url: meta.avatar_url ?? null,
                is_admin: false,
              },
              { onConflict: "id" }
            )
            .select()
            .maybeSingle();
          profile = newProfile;
        }

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
