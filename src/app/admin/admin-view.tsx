"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trophy, Users, Calendar, Activity, Shield, Zap, CheckCircle2, AlertCircle, Loader2, Bell, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

type SyncState = "idle" | "loading" | "ok" | "error";

interface SyncResult {
  ok?: boolean;
  action?: string;
  results?: Record<string, unknown>;
  error?: string;
}

function NotificationsPanel() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ email?: boolean; whatsapp?: boolean; error?: string } | null>(null);

  const sendTest = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          homeTeam: "México", awayTeam: "Sudáfrica",
          homeScore: 2, awayScore: 0,
          venue: "Estadio Azteca",
          rankingUpdated: false,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Email config */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-400" /> Notificaciones por Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-white/3 rounded-lg p-3 text-[11px] space-y-1.5">
            <p className="font-bold text-white">Servicio: <span className="text-blue-400">Resend</span> (gratis: 3,000 emails/mes)</p>
            <p className="text-muted-foreground">1. Regístrate en <strong className="text-white">resend.com</strong></p>
            <p className="text-muted-foreground">2. Crea una API Key → agrégala en <code className="bg-white/10 px-1 rounded">.env.local</code>:</p>
            <code className="block bg-black/30 rounded p-2 text-emerald-400">
              RESEND_API_KEY=re_xxxxxxxxx{"\n"}
              NOTIFICATION_EMAILS=correo1@gmail.com,correo2@gmail.com
            </code>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp config */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-400" /> Notificaciones por WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-white/3 rounded-lg p-3 text-[11px] space-y-1.5">
            <p className="font-bold text-white">Servicio: <span className="text-emerald-400">Twilio</span> (sandbox gratis, producción de pago)</p>
            <p className="text-muted-foreground">1. Regístrate en <strong className="text-white">twilio.com</strong> → activa WhatsApp Sandbox</p>
            <p className="text-muted-foreground">2. Desde tu WhatsApp, envía el código de activación al número de Twilio</p>
            <p className="text-muted-foreground">3. Agrega en <code className="bg-white/10 px-1 rounded">.env.local</code>:</p>
            <code className="block bg-black/30 rounded p-2 text-emerald-400">
              TWILIO_ACCOUNT_SID=ACxxxxxxxxx{"\n"}
              TWILIO_AUTH_TOKEN=xxxxxxxxx{"\n"}
              TWILIO_WHATSAPP_FROM=whatsapp:+14155238886{"\n"}
              NOTIFICATION_WHATSAPPS=whatsapp:+584121234567
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Test button */}
      <div className="flex items-center gap-3">
        <Button onClick={sendTest} disabled={sending} variant="gradient" size="sm">
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Bell className="h-3.5 w-3.5 mr-1.5" />}
          Enviar notificación de prueba
        </Button>
        {result && (
          <div className="text-xs">
            {result.error ? (
              <span className="text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{result.error}</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Email: {result.email ? "✓" : "✗ (config pendiente)"} · WA: {result.whatsapp ? "✓" : "✗ (config pendiente)"}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="glass rounded-xl border border-[hsl(var(--brand-gold)/0.3)] bg-[hsl(var(--brand-gold)/0.05)] p-3">
        <p className="text-[11px] text-[hsl(var(--brand-gold))] font-semibold mb-1">⚡ Automatización</p>
        <p className="text-[10px] text-muted-foreground">
          Para envíos automáticos cuando termine un partido, configura un Supabase Webhook
          que llame a <code className="bg-white/10 px-1 rounded">/api/notify</code> cuando <code className="bg-white/10 px-1 rounded">matches.status = &apos;finished&apos;</code>.
          O usa el botón &quot;Actualizar marcadores&quot; en API-Football → las notificaciones se dispararán automáticamente.
        </p>
      </div>
    </div>
  );
}

function ApiFootballPanel() {
  const [apiStatus, setApiStatus] = useState<{ requests?: { current: number; limit_day: number }; subscription?: { plan: string } } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});

  const loadApiStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/football/status");
      const data = await res.json();
      setApiStatus(data);
    } catch {
      setApiStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const runSync = async (action: string) => {
    setSyncStates(s => ({ ...s, [action]: "loading" }));
    setSyncResults(r => ({ ...r, [action]: {} }));
    try {
      const res = await fetch("/api/football/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setSyncResults(r => ({ ...r, [action]: data }));
      setSyncStates(s => ({ ...s, [action]: data.ok ? "ok" : "error" }));
    } catch (err) {
      setSyncResults(r => ({ ...r, [action]: { error: String(err) } }));
      setSyncStates(s => ({ ...s, [action]: "error" }));
    }
  };

  const syncActions = [
    {
      id: "scores",
      label: "Actualizar marcadores",
      desc: "Trae los resultados en tiempo real de API-Football y actualiza los partidos",
      icon: Zap,
      color: "text-yellow-400",
    },
    {
      id: "fixtures",
      label: "Sincronizar fixture completo",
      desc: "Importa todos los partidos del Mundial 2026 con fechas y sedes reales",
      icon: Calendar,
      color: "text-blue-400",
    },
    {
      id: "teams",
      label: "Actualizar logos de equipos",
      desc: "Descarga los logos oficiales de API-Football para todos los equipos",
      icon: Shield,
      color: "text-emerald-400",
    },
    {
      id: "all",
      label: "Sincronización completa",
      desc: "Ejecuta fixture + equipos + marcadores en una sola operación",
      icon: RefreshCw,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* API Status card */}
      <div className="glass rounded-xl border border-[hsl(var(--brand-blue)/0.3)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Estado API-Football</h3>
            <p className="text-[11px] text-muted-foreground">v3.football.api-sports.io</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadApiStatus} disabled={statusLoading}>
            {statusLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="ml-1.5">Verificar</span>
          </Button>
        </div>

        {apiStatus ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Requests hoy</p>
              <p className="text-xl font-bold text-white">
                {apiStatus.requests?.current ?? "—"}
                <span className="text-xs text-muted-foreground"> / {apiStatus.requests?.limit_day ?? 100}</span>
              </p>
              <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--brand-blue))] rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((apiStatus.requests?.current ?? 0) / (apiStatus.requests?.limit_day ?? 100)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plan</p>
              <p className="text-lg font-bold text-white capitalize">{apiStatus.subscription?.plan ?? "Free"}</p>
              <Badge variant="secondary" className="mt-1 text-[9px]">Activo</Badge>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground bg-white/3 rounded-lg p-3">
            Haz clic en "Verificar" para comprobar el estado. Asegúrate de haber agregado{" "}
            <code className="bg-white/10 px-1 rounded font-mono">API_FOOTBALL_KEY</code> a{" "}
            <code className="bg-white/10 px-1 rounded font-mono">.env.local</code>
          </div>
        )}
      </div>

      {/* Sync actions */}
      <div className="space-y-2">
        {syncActions.map((action) => {
          const state = syncStates[action.id] ?? "idle";
          const result = syncResults[action.id];
          return (
            <div key={action.id} className="glass rounded-xl border border-border/30 p-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                  {result?.error && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {result.error}
                    </p>
                  )}
                  {result?.ok && result.results && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {JSON.stringify(result.results).slice(0, 120)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={state === "ok" ? "secondary" : "outline"}
                  disabled={state === "loading"}
                  onClick={() => runSync(action.id)}
                  className="shrink-0"
                >
                  {state === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : state === "ok" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5">
                    {state === "loading" ? "Sincronizando..." : state === "ok" ? "¡Listo!" : "Ejecutar"}
                  </span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Plan gratuito: 100 requests/día. Cada sincronización usa ~5-20 requests.
      </p>
    </div>
  );
}

export function AdminView() {
  const { user, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect once we've confirmed the real session from Supabase.
    // isInitialized becomes true after getSession() or onAuthStateChange fires,
    // preventing premature redirects when the store rehydrates from localStorage.
    if (isInitialized && !isLoading && (!user || !(user as any).is_admin)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, isInitialized, router]);

  // Show loading spinner while session is being confirmed
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[hsl(var(--brand-gold))] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!(user as any)?.is_admin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground">Mundial FIFA 2026</p>
        </div>
        <Badge variant="gold" className="ml-auto">Admin</Badge>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Usuarios", value: "—", icon: Users, color: "text-primary" },
          { label: "Partidos", value: "104", icon: Calendar, color: "text-accent" },
          { label: "Predicciones", value: "—", icon: Trophy, color: "text-yellow-400" },
          { label: "Estado", value: "Activo", icon: Activity, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-border/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="api">
        <TabsList className="glass border border-border/30 mb-6 flex-wrap">
          <TabsTrigger value="api">API-Football</TabsTrigger>
          <TabsTrigger value="notify">Notificaciones</TabsTrigger>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card className="glass border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Sincronización con API-Football
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApiFootballPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notify">
          <NotificationsPanel />
        </TabsContent>

        <TabsContent value="matches">
          <Card className="glass border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Gestión de Partidos</span>
                <Button variant="gradient" size="sm">+ Nuevo partido</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Los partidos se administran desde el dashboard de Supabase</p>
                <p className="text-xs mt-1">Conecta tu proyecto Supabase para gestionar fixtures</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Usuarios registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Gestiona usuarios desde el panel de Supabase Auth</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="glass border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Configuración del sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Recalcular todos los puntos", desc: "Ejecuta la función SQL para recalcular predicciones", action: "Ejecutar" },
                { label: "Actualizar ranking global", desc: "Recalcula posiciones para todos los usuarios", action: "Ejecutar" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 glass rounded-xl border border-border/30">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">{item.action}</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
