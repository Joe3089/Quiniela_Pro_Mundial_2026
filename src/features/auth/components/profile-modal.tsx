"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, Save, Edit2, Eye, EyeOff, CheckCircle2, Phone, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("La imagen no puede superar 2 MB"); return; }

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbErr } = await (supabase as any).from("users").update({ avatar_url: urlWithCache }).eq("id", user.id);
      if (dbErr) throw dbErr;

      setUser({ ...user, avatar_url: urlWithCache });
      setAvatarPreview(urlWithCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEdit = () => {
    setDisplayName(user.display_name ?? "");
    setUsername(user.username ?? "");
    setWhatsappPhone((user as any).whatsapp_phone ?? "");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async () => {
    setError(null);

    if (!username.trim()) {
      setError("El nombre de usuario no puede estar vacío");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from("users")
        .update({
          display_name: displayName.trim() || null,
          username: username.trim(),
          whatsapp_phone: whatsappPhone.trim() || null,
        } as any)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) throw pwError;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser({ ...user, ...(data as any), auth: user.auth });
      setSaved(true);
      setEditing(false);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-md mx-auto"
          >
            <div
              className="glass-card rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-base font-bold text-white">Mis datos</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Avatar row */}
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-14 w-14 ring-2 ring-[hsl(var(--primary)/0.4)]">
                      <AvatarImage src={avatarPreview ?? user.avatar_url ?? ""} />
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--brand-blue-dark))] text-white text-lg font-black">
                        {getInitials(user.display_name ?? user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {avatarUploading ? (
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
                  <div>
                    <p className="font-semibold text-white leading-tight">
                      {user.display_name ?? user.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Toca la foto para cambiarla</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Nombre completo
                    </Label>
                    <Input
                      value={editing ? displayName : (user.display_name ?? "")}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!editing}
                      placeholder="Tu nombre completo"
                      className="bg-white/5 border-white/10 disabled:opacity-55 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Nombre de usuario
                    </Label>
                    <Input
                      value={editing ? username : user.username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!editing}
                      placeholder="nombredeusuario"
                      className="bg-white/5 border-white/10 disabled:opacity-55 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      Correo electrónico
                    </Label>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      WhatsApp
                      {!editing && !(user as any).whatsapp_phone && (
                        <span className="text-amber-400 text-[9px] font-bold bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full ml-1">Pendiente</span>
                      )}
                    </Label>
                    <Input
                      value={editing ? whatsappPhone : ((user as any).whatsapp_phone ?? "")}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      disabled={!editing}
                      placeholder="+58 412 000 0000"
                      type="tel"
                      className="bg-white/5 border-white/10 disabled:opacity-55 disabled:cursor-not-allowed"
                    />
                    {editing && (
                      <p className="text-[10px] text-muted-foreground">Incluye el código de país. Ej: +58 412 000 0000</p>
                    )}
                  </div>

                  {editing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="pt-1 h-px bg-white/5" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-3 w-3" />
                        Cambiar contraseña (opcional)
                      </p>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="bg-white/5 border-white/10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {newPassword && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Confirmar contraseña</Label>
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la contraseña"
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {error && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex gap-2">
                {saved ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex items-center gap-2 text-xs text-emerald-400 font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Cambios guardados correctamente
                  </motion.div>
                ) : editing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 text-muted-foreground"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--brand-blue-dark))] text-white font-semibold hover:opacity-90"
                    >
                      {saving ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          Guardando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Save className="h-3.5 w-3.5" />
                          Guardar cambios
                        </span>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar perfil
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
