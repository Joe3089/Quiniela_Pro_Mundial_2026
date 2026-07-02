import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Record that was previously broken vs what's now confirmed
const ATTENDANCE_RECORD_KEY = "attendance_wc2026";
const ATTENDANCE_PREVIOUS = 3_587_538; // USA 1994

export async function GET() {
  const supabase = await createAdminClient();

  // Get confirmed broken records from DB
  const { data: broken } = await supabase
    .from("historical_records_broken")
    .select("*")
    .order("date_broken", { ascending: true });

  // Check attendance: sum all match attendances stored
  const { data: attendanceData } = await supabase
    .from("matches")
    .select("attendance")
    .not("attendance", "is", null)
    .eq("status", "finished");

  const totalAttendance = (attendanceData ?? []).reduce(
    (sum, m) => sum + ((m.attendance as number | null) ?? 0),
    0
  );

  // If attendance record broken and not yet in DB, auto-add it
  if (totalAttendance > ATTENDANCE_PREVIOUS) {
    const already = (broken ?? []).find(r => r.record_key === ATTENDANCE_RECORD_KEY);
    if (!already) {
      await supabase.from("historical_records_broken").upsert({
        record_key: ATTENDANCE_RECORD_KEY,
        category: "Sede",
        record_name: "Mayor asistencia en un Mundial",
        previous_holder: "EE.UU. 1994",
        previous_value: "3,587,538 espectadores",
        new_holder: "Mundial 2026 (EE.UU. · Canadá · México)",
        new_value: `${totalAttendance.toLocaleString("es-MX")} espectadores`,
        match_info: "Récord superado durante el transcurso del torneo",
        date_broken: new Date().toISOString().split("T")[0],
        tournament: "FIFA World Cup 2026",
        verified: true,
      }, { onConflict: "record_key" });
    }
  }

  return NextResponse.json({
    broken: broken ?? [],
    totalAttendance,
    attendanceRecord: ATTENDANCE_PREVIOUS,
    attendanceBroken: totalAttendance > ATTENDANCE_PREVIOUS,
  });
}
