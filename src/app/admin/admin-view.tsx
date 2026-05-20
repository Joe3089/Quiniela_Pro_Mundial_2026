"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Trophy, Users, Calendar, Activity, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminView() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user?.is_admin) return null;

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

      <Tabs defaultValue="matches">
        <TabsList className="glass border border-border/30 mb-6">
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

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
