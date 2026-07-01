/**
 * Notification service — Email (Resend) + WhatsApp (Meta Cloud API)
 *
 * Required env vars:
 *   RESEND_API_KEY            — from resend.com (free: 3000 emails/month)
 *   NOTIFICATION_EMAILS       — comma-separated: user1@gmail.com,user2@gmail.com
 *   META_WHATSAPP_TOKEN       — permanent access token from Meta App Dashboard
 *   META_WHATSAPP_PHONE_ID    — WhatsApp Business Phone Number ID
 *   NOTIFICATION_WHATSAPPS    — comma-separated phone numbers: +584121234567,+584161234567
 */

export interface MatchNotification {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  venue?: string;
  rankingUpdated?: boolean;
  topRanking?: Array<{ position: number; displayName: string; points: number }>;
}

// ── Email via Resend ──────────────────────────────────────────────────────────

export async function sendEmailNotification(match: MatchNotification): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const emailsRaw = process.env.NOTIFICATION_EMAILS ?? "1001.19687168.ucla@gmail.com";
  const emails = emailsRaw.split(",").map((e) => e.trim()).filter(Boolean);

  if (!apiKey || !emails.length) {
    console.warn("[Notify] Email not configured — set RESEND_API_KEY");
    return false;
  }

  const rankingHtml = match.topRanking?.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr style="background:#1D4ED8;color:white">
          <th style="padding:8px">Pos</th>
          <th style="padding:8px">Jugador</th>
          <th style="padding:8px">Pts</th>
        </tr>
        ${match.topRanking.slice(0, 5).map((r) =>
          `<tr style="background:${r.position === 1 ? "#FEF9C3" : "white"}">
            <td style="padding:8px;text-align:center"><strong>${r.position}</strong></td>
            <td style="padding:8px">${r.displayName}</td>
            <td style="padding:8px;text-align:center;font-weight:bold">${r.points}</td>
          </tr>`
        ).join("")}
       </table>`
    : "";

  const payload = {
    from: "Quiniela Pro <onboarding@resend.dev>",
    to: emails,
    subject: `⚽ Partido finalizado: ${match.homeTeam} ${match.homeScore}–${match.awayScore} ${match.awayTeam}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:white;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1D4ED8,#1e3a8a);padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">⚽ Quiniela Pro</h1>
          <p style="margin:4px 0 0;opacity:.8;font-size:13px">FIFA World Cup 2026</p>
        </div>
        <div style="padding:24px">
          <h2 style="text-align:center;font-size:28px;margin:0 0 8px">
            ${match.homeTeam}
            <span style="color:#F59E0B">${match.homeScore} – ${match.awayScore}</span>
            ${match.awayTeam}
          </h2>
          <p style="text-align:center;color:#94A3B8;font-size:13px;margin:0">${match.venue ?? ""}</p>
          ${match.rankingUpdated
            ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin-top:20px">
                <h3 style="color:#F59E0B;margin:0 0 8px;font-size:14px">🏆 Ranking actualizado</h3>
                ${rankingHtml}
               </div>`
            : ""}
          <p style="text-align:center;margin-top:24px">
            <a href="https://quiniela-pro-mundial-2026.vercel.app/rankings"
               style="background:#1D4ED8;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
              Ver ranking completo →
            </a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error("[Notify] Email failed:", await res.text());
    return res.ok;
  } catch (err) {
    console.error("[Notify] Email error:", err);
    return false;
  }
}

// ── WhatsApp via Meta Cloud API ───────────────────────────────────────────────

export async function sendWhatsAppNotification(match: MatchNotification): Promise<boolean> {
  const token      = process.env.META_WHATSAPP_TOKEN;
  const phoneId    = process.env.META_WHATSAPP_PHONE_ID;
  const recipients = (process.env.NOTIFICATION_WHATSAPPS ?? "")
    .split(",")
    .map((n) => n.trim().replace(/\s+/g, "").replace(/^whatsapp:/i, ""))
    .filter(Boolean);

  if (!token || !phoneId || !recipients.length) {
    console.warn(
      "[Notify] WhatsApp not configured — set META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_ID, NOTIFICATION_WHATSAPPS"
    );
    return false;
  }

  const topStr = match.topRanking?.length
    ? "\n\n🏆 *Top ranking:*\n" +
      match.topRanking.slice(0, 3).map((r) => `${r.position}. ${r.displayName} — ${r.points} pts`).join("\n")
    : "";

  const body =
    `⚽ *Quiniela Pro | FIFA WC 2026*\n\n` +
    `Partido finalizado:\n` +
    `*${match.homeTeam} ${match.homeScore} – ${match.awayScore} ${match.awayTeam}*` +
    (match.venue ? `\n📍 ${match.venue}` : "") +
    topStr +
    `\n\n👉 Ver ranking: https://quiniela-pro-mundial-2026.vercel.app/rankings`;

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  let allOk = true;
  for (const to of recipients) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(`[Notify] WhatsApp failed for ${to}:`, data);
        allOk = false;
      }
    } catch (err) {
      console.error(`[Notify] WhatsApp error for ${to}:`, err);
      allOk = false;
    }
  }
  return allOk;
}

// ── Internal app notifications (Supabase DB) ─────────────────────────────────

export async function sendInternalNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  opts: { tournamentId: string; type: string; title: string; body: string; userIds?: string[] }
) {
  if (!opts.userIds?.length) return true;
  try {
    const rows = opts.userIds.map((user_id) => ({
      user_id,
      tournament_id: opts.tournamentId,
      type: opts.type,
      channel: "app",
      title: opts.title,
      body: opts.body,
      status: "sent",
      is_read: false,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) console.error("[Notify] Internal DB error:", error);
    return !error;
  } catch (err) {
    console.error("[Notify] Internal notification error:", err);
    return false;
  }
}

// ── Record broken notifications ───────────────────────────────────────────────

export async function notifyRecordBroken(opts: {
  playerName: string;
  totalGoals: number;
  previousHolder: string;
  previousRecord: number;
}): Promise<{ email: boolean; whatsapp: boolean }> {
  const title = `🏆 ¡Récord histórico roto en el Mundial 2026!`;
  const body =
    `*${opts.playerName}* supera a ${opts.previousHolder} (${opts.previousRecord} goles) ` +
    `con *${opts.totalGoals} goles* en la historia de los Mundiales. ` +
    `¡Nuevo máximo goleador de todos los tiempos!\n\n` +
    `👉 Ver estadísticas: https://quiniela-pro-mundial-2026.vercel.app/estadisticas`;

  const apiKey = process.env.RESEND_API_KEY;
  const emailsRaw = process.env.NOTIFICATION_EMAILS ?? "1001.19687168.ucla@gmail.com";
  const emails = emailsRaw.split(",").map((e) => e.trim()).filter(Boolean);

  let emailOk = false;
  if (apiKey && emails.length) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Quiniela Pro <onboarding@resend.dev>",
          to: emails,
          subject: title,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:white;border-radius:12px;overflow:hidden;padding:24px">
            <h1 style="color:#F5A500;margin:0 0 16px">🏆 Récord histórico roto</h1>
            <p style="font-size:16px;line-height:1.6">${body.replace(/\*/g, "<b>").replace(/\*/g, "</b>")}</p>
            <p style="margin-top:24px;text-align:center">
              <a href="https://quiniela-pro-mundial-2026.vercel.app/estadisticas" style="background:#1D4ED8;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver estadísticas →</a>
            </p></div>`,
        }),
      });
      emailOk = res.ok;
    } catch { emailOk = false; }
  }

  const token   = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  const numbers = (process.env.NOTIFICATION_WHATSAPPS ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  let waOk = false;
  if (token && phoneId && numbers.length) {
    for (const to of numbers) {
      try {
        await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: `⚽ Quiniela Pro | FIFA WC 2026\n\n${body}` } }),
        });
        waOk = true;
      } catch { /* non-fatal */ }
    }
  }

  return { email: emailOk, whatsapp: waOk };
}

// ── Combined sender ───────────────────────────────────────────────────────────

export async function notifyMatchFinished(match: MatchNotification) {
  const [emailOk, waOk] = await Promise.all([
    sendEmailNotification(match),
    sendWhatsAppNotification(match),
  ]);
  return { email: emailOk, whatsapp: waOk };
}

// ── Configuration status ──────────────────────────────────────────────────────

export function getNotificationStatus() {
  return {
    resend: {
      configured: !!process.env.RESEND_API_KEY,
      recipients: (process.env.NOTIFICATION_EMAILS ?? "").split(",").filter(Boolean).length,
    },
    whatsapp: {
      configured: !!(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID),
      recipients: (process.env.NOTIFICATION_WHATSAPPS ?? "").split(",").filter(Boolean).length,
    },
  };
}
