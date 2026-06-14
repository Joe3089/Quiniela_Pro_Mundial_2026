"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, LayoutGrid, Target, BarChart3, Settings, LogOut,
  Menu, X, ChevronDown, Globe2, TrendingUp, UserCircle, Radio,
  Newspaper, Wifi, Clock, MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { getInitials, cn } from "@/lib/utils";
import { ProfileModal } from "@/features/auth/components/profile-modal";
import { useTimezone, TIMEZONE_OPTIONS } from "@/providers/timezone-provider";
import { Check } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Inicio",         icon: LayoutGrid,  live: false },
  { href: "/en-vivo",      label: "En Vivo",        icon: Radio,       live: true  },
  { href: "/fixtures",     label: "Partidos",       icon: Trophy,      live: false },
  { href: "/predictions",  label: "Predicciones",   icon: Target,      live: false },
  { href: "/rankings",     label: "Ranking",        icon: BarChart3,   live: false },
  { href: "/selecciones",  label: "Selecciones",    icon: Globe2,      live: false },
  { href: "/estadisticas", label: "Estadísticas",   icon: TrendingUp,  live: false },
  { href: "/noticias",     label: "Noticias",       icon: Newspaper,   live: false },
];

// ── Timezone selector inside dropdown ────────────────────────────────────────
function TimezoneDropdownSection({ onClose }: { onClose: () => void }) {
  const { tz, option, setTz } = useTimezone();
  const [tzOpen, setTzOpen] = useState(false);

  return (
    <div className="px-3 py-2 border-b border-white/8">
      <button
        onClick={() => setTzOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 text-left group"
      >
        <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center shrink-0">
          <Clock className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Zona horaria</p>
          <p className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
            <span>{option.flag}</span>
            <span>{option.country}</span>
            <span className="text-muted-foreground font-medium">·</span>
            <span className="text-[hsl(var(--primary))] font-medium">{option.label}</span>
          </p>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0", tzOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {tzOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5 pr-1 scrollbar-none">
              {TIMEZONE_OPTIONS.map((opt) => (
                <button
                  key={opt.tz}
                  onClick={() => { setTz(opt.tz); setTzOpen(false); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] transition-colors",
                    tz === opt.tz
                      ? "bg-[hsl(var(--primary)/0.15)] text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="w-5 text-sm">{opt.flag}</span>
                  <span className="flex-1 font-medium truncate">{opt.country}</span>
                  <span className="text-[10px] text-muted-foreground/70 shrink-0">{opt.label}</span>
                  {tz === opt.tz && <Check className="h-3 w-3 text-[hsl(var(--primary))] shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, isInitialized } = useAuthStore();
  const authReady = isInitialized && !isLoading;
  const { option: tzOption } = useTimezone();

  const navItems = NAV_ITEMS.map((item) =>
    item.href === "/dashboard"
      ? { ...item, href: user ? "/dashboard" : "/" }
      : item
  );

  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const isAdmin = (user as { is_admin?: boolean } | null)?.is_admin;

  useEffect(() => {
    setHasMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [userMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top border accent */}
        <div className="h-[2px] bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--brand-gold))] to-[hsl(var(--primary))]" />

        <div
          className={cn(
            "transition-all duration-300",
            scrolled
              ? "bg-black/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              : "glass border-b border-white/5",
            mobileOpen ? "border-b-white/10" : ""
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">

              {/* Logo */}
              <Logo size="sm" variant="full" />

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-0.5">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                        active
                          ? "text-white"
                          : item.live
                          ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                      {item.live && !active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {active && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-lg -z-10"
                          style={{
                            background: "linear-gradient(135deg, rgba(29,78,216,0.25), rgba(30,58,138,0.20))",
                            border: "1px solid rgba(29,78,216,0.30)",
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-2">

                {/* Auth loading skeleton */}
                {hasMounted && !authReady && (
                  <div className="hidden md:block h-9 w-48 rounded-xl bg-white/5 animate-pulse" />
                )}

                {/* Authenticated user block */}
                {hasMounted && authReady && user ? (
                  <div className="relative" data-user-menu>
                    <button
                      onClick={() => setUserMenuOpen((o) => !o)}
                      className={cn(
                        "flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all duration-200",
                        userMenuOpen
                          ? "bg-white/10 border-white/20"
                          : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15"
                      )}
                    >
                      {/* Online indicator + Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="h-7 w-7 ring-2 ring-[hsl(var(--primary)/0.5)]">
                          <AvatarImage src={user.avatar_url ?? ""} />
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--brand-blue-dark))] text-white text-xs font-bold">
                            {getInitials(user.display_name ?? user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                      </div>

                      {/* Name + timezone */}
                      <div className="hidden md:flex flex-col items-start leading-none">
                        <span className="text-xs font-bold text-white max-w-[100px] truncate">
                          {user.display_name ?? user.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span>{tzOption.flag}</span>
                          <span>{tzOption.label}</span>
                        </span>
                      </div>

                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                        userMenuOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Premium dropdown */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-72 glass-card rounded-2xl border border-white/12 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
                        >
                          {/* User header */}
                          <div className="px-4 py-4 bg-gradient-to-br from-[hsl(var(--primary)/0.12)] to-transparent border-b border-white/8">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <Avatar className="h-12 w-12 ring-2 ring-[hsl(var(--primary)/0.5)]">
                                  <AvatarImage src={user.avatar_url ?? ""} />
                                  <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--brand-blue-dark))] text-white text-base font-black">
                                    {getInitials(user.display_name ?? user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-black" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate">
                                  {user.display_name ?? user.username}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {user.email}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                                    <Wifi className="h-2.5 w-2.5" />
                                    Conectado
                                  </span>
                                  {isAdmin && (
                                    <span className="text-[10px] font-bold text-[hsl(var(--brand-gold))] bg-[hsl(var(--brand-gold)/0.12)] border border-[hsl(var(--brand-gold)/0.25)] px-2 py-0.5 rounded-full">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Timezone section */}
                          <TimezoneDropdownSection onClose={() => setUserMenuOpen(false)} />

                          {/* Menu items */}
                          <div className="p-1.5">
                            <button
                              onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center">
                                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <span className="font-medium text-white/80">Mis datos</span>
                            </button>

                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg bg-[hsl(var(--brand-gold)/0.12)] flex items-center justify-center">
                                  <Settings className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />
                                </div>
                                <span className="font-medium text-[hsl(var(--brand-gold))]">Admin</span>
                              </Link>
                            )}

                            <div className="my-1 mx-2 h-px bg-white/6" />

                            <button
                              onClick={() => { logout.mutate(); setUserMenuOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <div className="h-7 w-7 rounded-lg bg-red-500/5 flex items-center justify-center">
                                <LogOut className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium">Cerrar sesión</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : hasMounted && authReady && !user ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-white">
                      <Link href="/auth/register">Registrarse</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-semibold shadow-[0_0_16px_rgba(29,78,216,0.4)] hover:shadow-[0_0_24px_rgba(29,78,216,0.6)] transition-all"
                    >
                      <Link href="/auth/login">Iniciar sesión</Link>
                    </Button>
                  </div>
                ) : null}

                {/* Mobile menu toggle */}
                <button
                  className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={() => setMobileOpen((o) => !o)}
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-white/5 lg:hidden"
              >
                <div className="px-4 py-3 space-y-1">
                  {/* Mobile user info */}
                  {hasMounted && authReady && user && (
                    <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-[hsl(var(--primary)/0.1)] to-transparent border border-white/8 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9 ring-2 ring-[hsl(var(--primary)/0.4)]">
                          <AvatarImage src={user.avatar_url ?? ""} />
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--brand-blue-dark))] text-white text-xs font-black">
                            {getInitials(user.display_name ?? user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.display_name ?? user.username}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>{tzOption.flag}</span>
                          <span>{tzOption.country} · {tzOption.label}</span>
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Wifi className="h-2.5 w-2.5" />
                        Online
                      </span>
                    </div>
                  )}

                  {navItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          active
                            ? "bg-gradient-to-r from-[hsl(var(--primary)/0.15)] to-[hsl(var(--brand-blue-dark)/0.15)] text-white border border-[hsl(var(--primary)/0.2)]"
                            : item.live
                            ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.live && !active && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-auto" />
                        )}
                      </Link>
                    );
                  })}

                  {hasMounted && authReady && !user && (
                    <div className="pt-2 flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" asChild>
                        <Link href="/auth/register" onClick={() => setMobileOpen(false)}>Registrarse</Link>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-semibold"
                        asChild
                      >
                        <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Iniciar sesión</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-[calc(2px+3.5rem)]" />

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
