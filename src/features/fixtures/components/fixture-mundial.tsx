"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Team {
  id: string;
  name: string;
  flag_url: string | null;
}

interface Match {
  id: string;
  phase: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
}

interface Partido {
  id: string;
  fase: string;
  fecha_hora: string;
  local: Team;
  visitante: Team;
}

export function FixtureMundial() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function cargarPartidos() {
      try {
        // Fetch matches
        const { data: matches, error: matchError } = await supabase
          .from('matches')
          .select('id, phase, match_date, home_team_id, away_team_id')
          .order('match_date', { ascending: true });

        if (matchError) throw matchError;
        if (!matches || matches.length === 0) {
          setPartidos([]);
          return;
        }

        // Collect all unique team IDs
        const teamIds = new Set<string>();
        matches.forEach((m: Match) => {
          if (m.home_team_id) teamIds.add(m.home_team_id);
          if (m.away_team_id) teamIds.add(m.away_team_id);
        });

        // Fetch all teams at once
        const { data: teams, error: teamError } = await supabase
          .from('teams')
          .select('id, name, flag_url')
          .in('id', Array.from(teamIds));

        if (teamError) throw teamError;

        // Create a map of teams by ID for quick lookup
        const teamMap = new Map<string, Team>();
        (teams || []).forEach((team: Team) => {
          teamMap.set(team.id, team);
        });

        // Map matches to partido format
        const partidosMapeados: Partido[] = matches.map((match: Match) => ({
          id: match.id,
          fase: match.phase,
          fecha_hora: match.match_date,
          local: teamMap.get(match.home_team_id) || { id: '', name: 'TBD', flag_url: null },
          visitante: teamMap.get(match.away_team_id) || { id: '', name: 'TBD', flag_url: null },
        }));

        setPartidos(partidosMapeados);
      } catch (err: any) {
        console.error('Error loading matches:', err);
        setError(err.message || 'Error loading matches');
      } finally {
        setCargando(false);
      }
    }

    cargarPartidos();
  }, []);

  if (cargando) return <div className="text-center p-10 font-semibold text-gray-500">Cargando el calendario...</div>;
  if (error) return <div className="text-center p-10 text-red-500 font-semibold">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h2 className="text-3xl font-bold text-center mb-8 text-white bg-blue-900 p-4 rounded-lg shadow-lg">
        Fase de Grupos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partidos.map((partido) => (
          <div 
            key={partido.id} 
            className="bg-white rounded-xl shadow p-5 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>{partido.fase}</span>
              <span>
                {new Date(partido.fecha_hora).toLocaleDateString('es-ES', { 
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center w-1/3 text-center">
                {partido.local?.flag_url && (
                  <img 
                    src={partido.local.flag_url} 
                    alt={partido.local?.name} 
                    className="w-16 h-10 object-cover rounded border border-gray-300 shadow-sm mb-2"
                  />
                )}
                <span className="font-bold text-gray-800">{partido.local?.name}</span>
              </div>

              <div className="w-1/3 text-center">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold text-sm">VS</span>
              </div>

              <div className="flex flex-col items-center w-1/3 text-center">
                {partido.visitante?.flag_url && (
                  <img 
                    src={partido.visitante.flag_url} 
                    alt={partido.visitante?.name} 
                    className="w-16 h-10 object-cover rounded border border-gray-300 shadow-sm mb-2"
                  />
                )}
                <span className="font-bold text-gray-800">{partido.visitante?.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}