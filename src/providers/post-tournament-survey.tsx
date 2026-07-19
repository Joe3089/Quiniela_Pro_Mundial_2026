"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { createClient } from "@/lib/supabase/client";
import { TOURNAMENT_ID } from "@/constants";
import { cn } from "@/lib/utils";

const EXCLUDED_EMAILS = new Set(["joe.verde89@gmail.com"]);

export function PostTournamentSurvey() {
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const eligible =
    isAuthenticated &&
    !!user &&
    !user.is_admin &&
    !EXCLUDED_EMAILS.has((user.email ?? "").toLowerCase());

  const { data: tournamentEnded } = useQuery({
    queryKey: ["survey-tournament-final-status"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from("matches")
        .select("status")
        .eq("tournament_id", TOURNAMENT_ID)
        .eq("phase", "final")
        .maybeSingle();
      return data?.status === "finished";
    },
    enabled: eligible,
    staleTime: 5 * 60 * 1000,
  });

  const { data: alreadyAnswered, isLoading: checkingAnswered } = useQuery({
    queryKey: ["survey-already-answered", user?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from("survey_responses")
        .select("id")
        .eq("user_id", user!.id)
        .eq("tournament_id", TOURNAMENT_ID)
        .maybeSingle();
      return !!data;
    },
    enabled: eligible && !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (eligible && tournamentEnded && !checkingAnswered && alreadyAnswered === false) {
      setOpen(true);
    }
  }, [eligible, tournamentEnded, checkingAnswered, alreadyAnswered]);

  const [rating, setRating] = useState(0);
  const [improve, setImprove] = useState("");
  const [addFeature, setAddFeature] = useState("");
  const [removeFeature, setRemoveFeature] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [recommendReason, setRecommendReason] = useState("");
  const [nextVersion, setNextVersion] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!user) return;
    if (rating < 1 || recommend === null) {
      setError("Completa la calificación y si recomendarías la app.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await (supabase as any).from("survey_responses").insert({
      user_id: user.id,
      tournament_id: TOURNAMENT_ID,
      rating,
      improve: improve.trim() || null,
      add_feature: addFeature.trim() || null,
      remove_feature: removeFeature.trim() || null,
      would_recommend: recommend,
      recommend_reason: recommendReason.trim() || null,
      next_version_wishes: nextVersion.trim() || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError("No se pudo guardar tu respuesta. Intenta de nuevo.");
      return;
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-black text-white mb-1">¡Gracias por jugar la Quiniela!</h2>
          <p className="text-sm text-muted-foreground">
            El Mundial terminó. Ayúdanos con esta breve encuesta — es única y no volverá a aparecer.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/80 mb-1.5 block">Calificación general</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star
                    className={cn("h-7 w-7 transition-colors", n <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/20")}
                  />
                </button>
              ))}
            </div>
          </div>

          <TextField label="¿Qué debe mejorar la app?" value={improve} onChange={setImprove} />
          <TextField label="¿Qué le agregarías?" value={addFeature} onChange={setAddFeature} />
          <TextField label="¿Qué le quitarías?" value={removeFeature} onChange={setRemoveFeature} />

          <div>
            <label className="text-xs font-bold text-white/80 mb-1.5 block">¿La recomendarías?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecommend(true)}
                className={cn("flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  recommend === true ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-white/10 text-white/60 hover:bg-white/5")}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setRecommend(false)}
                className={cn("flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  recommend === false ? "bg-red-500/20 border-red-500/50 text-red-400" : "border-white/10 text-white/60 hover:bg-white/5")}
              >
                No
              </button>
            </div>
          </div>

          <TextField label="¿Por qué?" value={recommendReason} onChange={setRecommendReason} />
          <TextField label="¿Qué te gustaría para la próxima versión?" value={nextVersion} onChange={setNextVersion} />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-[hsl(var(--brand-blue-light))] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar respuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-white/80 mb-1.5 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(var(--brand-blue-light))] resize-none"
      />
    </div>
  );
}
