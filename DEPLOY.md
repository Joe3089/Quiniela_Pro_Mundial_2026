# Deploy Guide - Quiniela Pro Mundial 2026

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecuta en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_mundial_2026.sql`
3. En Authentication > URL Configuration:
   - Site URL: `https://tu-app.vercel.app`
   - Redirect URLs: `https://tu-app.vercel.app/auth/callback`
4. Para Google OAuth (opcional):
   - Authentication > Providers > Google
   - Agrega Client ID y Secret de Google Cloud Console

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

## 3. Deploy en Vercel

```bash
npm install -g vercel
vercel
```

O conecta el repositorio desde [vercel.com](https://vercel.com) y agrega las variables de entorno.

## 4. Crear primer admin

1. Regístrate normalmente en la app
2. En Supabase SQL Editor:
```sql
update public.users set is_admin = true where email = 'tu@email.com';
```

## 5. Agregar partidos (admin)

Desde el panel admin en `/admin` o directamente desde el SQL Editor de Supabase.

## Scoring System

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto + ganador | 5 pts |
| Ganador correcto | 3 pts |
| Empate exacto (misma diferencia) | 2 pts |
| Empate (solo resultado) | 1 pt |
| Predicción incorrecta | 0 pts |

## Stack

- **Frontend**: Next.js 16, TypeScript, TailwindCSS v4, Shadcn UI, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State**: Zustand + TanStack Query
- **Deploy**: Vercel
- **PWA**: Service Worker nativo, manifest.json
