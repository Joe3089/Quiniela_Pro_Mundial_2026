"use client";

import Image from "next/image";

// Maps country names (as returned by football APIs) → ISO codes
export const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  "Argentina": "ar", "Brazil": "br", "France": "fr", "Germany": "de",
  "England": "gb-eng", "Spain": "es", "Italy": "it", "Portugal": "pt",
  "Netherlands": "nl", "Belgium": "be", "Japan": "jp", "South Korea": "kr",
  "Korea Republic": "kr", "United States": "us", "USA": "us", "Mexico": "mx",
  "Colombia": "co", "Uruguay": "uy", "Chile": "cl", "Peru": "pe",
  "Ecuador": "ec", "Paraguay": "py", "Bolivia": "bo", "Venezuela": "ve",
  "Morocco": "ma", "Senegal": "sn", "Nigeria": "ng", "Ghana": "gh",
  "Egypt": "eg", "Cameroon": "cm", "Tunisia": "tn", "Algeria": "dz",
  "DR Congo": "cd", "Ivory Coast": "ci", "South Africa": "za",
  "Cape Verde": "cv", "Mali": "ml", "Tanzania": "tz",
  "Saudi Arabia": "sa", "Iran": "ir", "Qatar": "qa", "Iraq": "iq",
  "Jordan": "jo", "UAE": "ae", "Israel": "il",
  "Australia": "au", "New Zealand": "nz", "Indonesia": "id",
  "China": "cn", "Thailand": "th", "Kazakhstan": "kz", "Uzbekistan": "uz",
  "Turkey": "tr", "Serbia": "rs", "Croatia": "hr", "Poland": "pl",
  "Switzerland": "ch", "Denmark": "dk", "Sweden": "se", "Norway": "no",
  "Austria": "at", "Czech Republic": "cz", "Czechia": "cz", "Slovakia": "sk",
  "Hungary": "hu", "Romania": "ro", "Ukraine": "ua", "Greece": "gr",
  "Scotland": "gb-sct", "Wales": "gb-wls", "Northern Ireland": "gb-nir",
  "Republic of Ireland": "ie", "Ireland": "ie", "Slovenia": "si",
  "North Macedonia": "mk", "Montenegro": "me", "Georgia": "ge",
  "Canada": "ca", "Panama": "pa", "Jamaica": "jm", "Costa Rica": "cr",
  "Honduras": "hn", "Haiti": "ht", "Curacao": "cw", "Curaçao": "cw",
  "Russia": "ru", "Iceland": "is",
};

// Maps FIFA 3-letter codes → ISO 2-letter codes for flagcdn.com
const FIFA_TO_ISO: Record<string, string> = {
  // CONCACAF
  USA: "us", MEX: "mx", CAN: "ca", PAN: "pa", HON: "hn", JAM: "jm", CRC: "cr",
  CUW: "cw", HAI: "ht",
  // CONMEBOL
  ARG: "ar", BRA: "br", COL: "co", ECU: "ec", URU: "uy", VEN: "ve", BOL: "bo",
  CHI: "cl", PAR: "py", PER: "pe",
  // UEFA
  ESP: "es", FRA: "fr", ENG: "gb-eng", GER: "de", POR: "pt", NED: "nl",
  BEL: "be", SRB: "rs", CRO: "hr", HUN: "hu", AUT: "at", DEN: "dk",
  SCO: "gb-sct", SVK: "sk", POL: "pl", TUR: "tr", ITA: "it", GRE: "gr",
  SUI: "ch", WAL: "gb-wls", NIR: "gb-nir", CZE: "cz", ROM: "ro", ALB: "al",
  SWE: "se", NOR: "no", BIH: "ba",
  // AFC
  JPN: "jp", KOR: "kr", IRN: "ir", KSA: "sa", AUS: "au", UZB: "uz",
  JOR: "jo", IRQ: "iq", CHN: "cn", THA: "th", QAT: "qa", UAE: "ae",
  // CAF
  MAR: "ma", SEN: "sn", NGA: "ng", EGY: "eg", CMR: "cm", GHA: "gh",
  CIV: "ci", RSA: "za", TUN: "tn", ALG: "dz", MLI: "ml", COD: "cd", RDC: "cd", CPV: "cv",
  // OFC
  NZL: "nz",
  // Other
  IDN: "id", ZAF: "za",
  // Historical WC hosts (new codes only — no duplicates)
  RUS: "ru", GEO: "ge", MNE: "me", MKD: "mk", KAZ: "kz",
  UKR: "ua", ISR: "il", ISL: "is", IRL: "ie", SVN: "si",
};

interface FlagImageProps {
  fifaCode?: string;
  countryName?: string;
  fallbackEmoji?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// flagcdn.com ONLY supports these widths: 20, 40, 80, 160, 320
// Using unsupported widths (24, 32, 48, 64) returns 404
const SIZES = {
  sm:  { w: 20,  h: 13,  cls: "w-5 h-[13px]"  },
  md:  { w: 40,  h: 27,  cls: "w-10 h-[27px]" },
  lg:  { w: 80,  h: 54,  cls: "w-20 h-[54px]" },
  xl:  { w: 80,  h: 54,  cls: "w-20 h-[54px]" },
};

export function FlagImage({ fifaCode, countryName, fallbackEmoji, size = "md", className = "" }: FlagImageProps) {
  const iso =
    (countryName ? COUNTRY_NAME_TO_ISO[countryName] : null) ??
    (fifaCode ? FIFA_TO_ISO[fifaCode.toUpperCase()] : null);
  const { w, h, cls } = SIZES[size];

  if (!iso) {
    return (
      <span className={`text-xl leading-none ${className}`}>{fallbackEmoji ?? countryName ?? fifaCode}</span>
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w${w}/${iso}.png`}
      alt={fifaCode}
      width={w}
      height={h}
      className={`object-cover rounded-sm shadow-sm ${cls} ${className}`}
      unoptimized
    />
  );
}
