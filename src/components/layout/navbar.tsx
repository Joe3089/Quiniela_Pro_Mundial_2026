"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, LayoutGrid, Target, BarChart3, Settings, LogOut, Menu, X, ChevronDown, Globe2, TrendingUp, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { getInitials, cn } from "@/lib/utils";
import { ProfileModal } from "@/features/auth/components/profile-modal";

const navItems = [
  { href: "/dashboard",    label: "Inicio",        icon: LayoutGrid },
  { href: "/fixtures",     label: "Partidos",       icon: Trophy },
  { href: "/predictions",  label: "Predicciones",   icon: Target },
  { href: "/rankings",     label: "Ranking",        icon: BarChart3 },
  { href: "/selecciones",  label: "Selecciones",    icon: Globe2 },
  { href: "/estadisticas", label: "Estadísticas",   icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = (user as { is_admin?: boolean } | null)?.is_admin;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top border accent */}
        <div className="h-[2px] bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--brand-gold))] to-[hsl(var(--primary))]" />

        <div
          className={cn(
            "transition-all duration-300",
            scrolled
              ? "bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
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
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
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
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen((o) => !o)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <Avatar className="h-7 w-7 ring-1 ring-[hsl(var(--primary)/0.4)]">
                        <AvatarImage src={user.avatar_url ?? ""} />
                        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--brand-blue-dark))] text-white text-xs font-bold">
                          {getInitials(user.display_name ?? user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                        {user.display_name ?? user.username}
                      </span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                        >
                          <div className="p-1">
                            <button
                              onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-left"
                            >
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              Mis datos
                            </button>
                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-[hsl(var(--brand-gold))]"
                              >
                                <Settings className="h-4 w-4" />
                                Admin
                              </Link>
                            )}
                            <div className="my-1 h-px bg-white/5" />
                            <button
                              onClick={() => { logout.mutate(); setUserMenuOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              Cerrar sesión
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
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
                )}

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
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  {!isAuthenticated && (
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

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
