"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ExternalLink, RefreshCw, Clock, Loader2, WifiOff, Globe, Trophy, Users, Tv, Radio } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceColor: string;
  category: string;
  image?: string | null;
}

const TABS = [
  { id: "all",           label: "Todas",          icon: Newspaper },
  { id: "fifa",          label: "FIFA",            icon: Globe },
  { id: "mundial",       label: "Mundial 2026",    icon: Trophy },
  { id: "convocatorias", label: "Convocatorias",   icon: Users },
  { id: "espn",          label: "ESPN",            icon: Tv },
  { id: "foxsports",     label: "FOX Sports",      icon: Tv },
  { id: "sportscenter",  label: "SportsCenter",    icon: Radio },
  { id: "dsports",       label: "DSPORTS",         icon: Tv },
  { id: "diarioas",      label: "Diario AS",       icon: Newspaper },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SOURCE_COLORS: Record<string, string> = {
  "FIFA News":    "#044B96",
  "BBC Sport":    "#BB1919",
  "Sky Sports":   "#00A0E2",
  "Marca":        "#E31E24",
  "ESPN":         "#FF6B00",
  "FOX Sports":   "#003DA5",
  "SportsCenter": "#CC0000",
  "DSPORTS":      "#0057A8",
  "Diario AS":    "#1E3A8A",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dateStr.slice(0, 16);
  }
}

function NewsCard({ item, idx }: { item: NewsItem; idx: number }) {
  const color = SOURCE_COLORS[item.source] ?? item.sourceColor ?? "#888";
  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.28 }}
      className="group block glass-card rounded-2xl border border-white/8 p-4 hover:border-white/15 hover:bg-white/3 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color, borderColor: `${color}40`, background: `${color}18` }}
            >
              {item.source}
            </span>
            {item.pubDate && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(item.pubDate)}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white leading-snug mb-1.5 group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-2">
            {item.title}
          </p>
          {item.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.a>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6 mt-1" />
    </div>
  );
}

export default function NoticiasPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["noticias", activeTab],
    queryFn: async () => {
      const params = activeTab !== "all" ? `?category=${activeTab}` : "";
      const res = await fetch(`/api/noticias${params}`);
      if (!res.ok) throw new Error("Failed to load news");
      return res.json() as Promise<{ items: NewsItem[] }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const items = data?.items ?? [];
  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.25)] flex items-center justify-center">
              <Newspaper className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-black text-white">Noticias</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {updatedAt ? `Actualizado a las ${updatedAt}` : "FIFA · ESPN · FOX Sports · SportsCenter · DSPORTS · Diario AS"}
          </p>
        </div>
        <Button variant="glass" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Actualizar
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hover">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0",
                active
                  ? "bg-[hsl(var(--primary)/0.2)] text-white border border-[hsl(var(--primary)/0.4)]"
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <WifiOff className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white/60">No se pudieron cargar las noticias</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Verifica tu conexión o intenta de nuevo</p>
            <Button variant="glass" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white/60">Sin noticias disponibles</p>
            <p className="text-xs text-muted-foreground mt-1">Los feeds RSS no devolvieron resultados para esta categoría</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {isFetching && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Actualizando noticias…
              </div>
            )}
            {items.map((item, i) => (
              <NewsCard key={`${item.source}-${i}`} item={item} idx={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
