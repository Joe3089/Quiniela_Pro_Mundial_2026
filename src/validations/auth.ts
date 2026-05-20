import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

export const registerSchema = z
  .object({
    email: z.string().email({ message: "Email inválido" }),
    username: z
      .string()
      .min(3, { message: "Mínimo 3 caracteres" })
      .max(20, { message: "Máximo 20 caracteres" })
      .regex(/^[a-z0-9_]+$/, { message: "Solo letras minúsculas, números y guiones bajos" }),
    display_name: z
      .string()
      .min(2, { message: "Mínimo 2 caracteres" })
      .max(50, { message: "Máximo 50 caracteres" }),
    password: z.string().min(8, { message: "Mínimo 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
