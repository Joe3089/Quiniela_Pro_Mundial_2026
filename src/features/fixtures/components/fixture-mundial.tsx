"use client";

import { useEffect, useState } from 'react';
// Ajusta esto a tu alias absoluto si usas @, o usa la ruta relativa: '../../../lib/supabase/client'
import { createClient } from '@/lib/supabase/client'; 

interface Equipo {
  name: string;
  flag_url: string;
}

interface Partido {
  id: string;
  fase: string;
  fecha_hora: string;
  local: Equipo;
  visitante: Equipo;
}

export function FixtureMundial() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function cargarPartidos() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            id,
            phase as fase,
            match_date as fecha_hora,
            local:teams!matches_home_team_id_fkey(name, flag_url),
            visitante:teams!matches_away_team_id_fkey(name, flag_url)
          `)
          .order('match_date', { ascending: true });

        if (error) throw error;
        
        setPartidos(data as unknown as Partido[]);
      } catch (err: any) {
        setError(err.message);
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
                <img 
                  src={partido.local?.flag_url} 
                  alt={partido.local?.name} 
                  className="w-16 h-10 object-cover rounded border border-gray-300 shadow-sm mb-2"
                />
                <span className="font-bold text-gray-800">{partido.local?.name}</span>
              </div>

              <div className="w-1/3 text-center">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold text-sm">VS</span>
              </div>

              <div className="flex flex-col items-center w-1/3 text-center">
                <img 
                  src={partido.visitante?.flag_url} 
                  alt={partido.visitante?.name} 
                  className="w-16 h-10 object-cover rounded border border-gray-300 shadow-sm mb-2"
                />
                <span className="font-bold text-gray-800">{partido.visitante?.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}