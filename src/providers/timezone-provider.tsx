"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// ── Country → IANA timezone list ──────────────────────────────────────────
export interface TimezoneOption {
  country: string;
  flag: string;
  tz: string;
  label: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { country: "Venezuela",         flag: "🇻🇪", tz: "America/Caracas",                  label: "VEN (UTC-4)"  },
  { country: "Argentina",         flag: "🇦🇷", tz: "America/Argentina/Buenos_Aires",   label: "ARG (UTC-3)"  },
  { country: "Brasil",            flag: "🇧🇷", tz: "America/Sao_Paulo",                label: "BRA (UTC-3)"  },
  { country: "Uruguay",           flag: "🇺🇾", tz: "America/Montevideo",               label: "URY (UTC-3)"  },
  { country: "Chile",             flag: "🇨🇱", tz: "America/Santiago",                 label: "CHL (UTC-3)"  },
  { country: "Bolivia",           flag: "🇧🇴", tz: "America/La_Paz",                   label: "BOL (UTC-4)"  },
  { country: "Paraguay",          flag: "🇵🇾", tz: "America/Asuncion",                 label: "PRY (UTC-4)"  },
  { country: "Colombia",          flag: "🇨🇴", tz: "America/Bogota",                   label: "COL (UTC-5)"  },
  { country: "Ecuador",           flag: "🇪🇨", tz: "America/Guayaquil",               label: "ECU (UTC-5)"  },
  { country: "Perú",              flag: "🇵🇪", tz: "America/Lima",                     label: "PER (UTC-5)"  },
  { country: "México",            flag: "🇲🇽", tz: "America/Mexico_City",             label: "MEX (UTC-6)"  },
  { country: "Costa Rica",        flag: "🇨🇷", tz: "America/Costa_Rica",              label: "CRI (UTC-6)"  },
  { country: "EE.UU. (Este)",     flag: "🇺🇸", tz: "America/New_York",                label: "EST (UTC-5)"  },
  { country: "EE.UU. (Centro)",   flag: "🇺🇸", tz: "America/Chicago",                 label: "CST (UTC-6)"  },
  { country: "EE.UU. (Pacífico)", flag: "🇺🇸", tz: "America/Los_Angeles",             label: "PST (UTC-8)"  },
  { country: "Canadá",            flag: "🇨🇦", tz: "America/Toronto",                 label: "CAN (UTC-5)"  },
  { country: "España",            flag: "🇪🇸", tz: "Europe/Madrid",                   label: "ESP (UTC+1)"  },
  { country: "Portugal",          flag: "🇵🇹", tz: "Europe/Lisbon",                   label: "POR (UTC+1)"  },
  { country: "Reino Unido",       flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tz: "Europe/London",                  label: "GBR (UTC+1)"  },
  { country: "Arabia Saudita",    flag: "🇸🇦", tz: "Asia/Riyadh",                     label: "KSA (UTC+3)"  },
  { country: "Japón",             flag: "🇯🇵", tz: "Asia/Tokyo",                      label: "JPN (UTC+9)"  },
];

const DEFAULT_TZ = "America/Caracas"; // Venezuela
const STORAGE_KEY = "tz_preference";

// ── Context ───────────────────────────────────────────────────────────────

interface TimezoneCtx {
  tz: string;
  option: TimezoneOption;
  setTz: (tz: string) => void;
}

const Context = createContext<TimezoneCtx>({
  tz: DEFAULT_TZ,
  option: TIMEZONE_OPTIONS[0],
  setTz: () => {},
});

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [tz, setTzState] = useState<string>(DEFAULT_TZ);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TIMEZONE_OPTIONS.some((o) => o.tz === saved)) {
      setTzState(saved);
    }
  }, []);

  const setTz = (newTz: string) => {
    setTzState(newTz);
    localStorage.setItem(STORAGE_KEY, newTz);
  };

  const option = TIMEZONE_OPTIONS.find((o) => o.tz === tz) ?? TIMEZONE_OPTIONS[0];

  return (
    <Context.Provider value={{ tz, option, setTz }}>
      {children}
    </Context.Provider>
  );
}

export function useTimezone() {
  return useContext(Context);
}

// ── Formatting helpers ────────────────────────────────────────────────────

export function formatInTz(
  dateStr: string,
  tz: string,
  opts: Intl.DateTimeFormatOptions,
  locale = "es-VE"
): string {
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: tz }).format(
    new Date(dateStr)
  );
}

export function formatTimeInTz(dateStr: string, tz: string): string {
  return formatInTz(dateStr, tz, { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatDateShortInTz(dateStr: string, tz: string): string {
  return formatInTz(dateStr, tz, { day: "numeric", month: "short" });
}

export function formatDateFullInTz(dateStr: string, tz: string): string {
  return formatInTz(dateStr, tz, {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
