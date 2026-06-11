/**
 * Notification service — Email (Resend) + WhatsApp (Twilio)
 *
 * Required env vars:
 *   RESEND_API_KEY         — from resend.com (free: 3000 emails/month)
 *   NOTIFICATION_EMAILS    — comma-separated list: user1@gmail.com,user2@gmail.com
 *   TWILIO_ACCOUNT_SID     — from twilio.com dashboard
 *   TWILIO_AUTH_TOKEN      — from twilio.com dashboard
 *   TWILIO_WHATSAPP_FROM   — whatsapp:+14155238886 (Twilio sandbox number)
 *   NOTIFICATION_WHATSAPPS — comma-separated: whatsapp:+584121234567,whatsapp:+584161234567
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

// ── Email via Resend ──────────────────────────────────────────────────────

export async function sendEmailNotification(match: MatchNotification): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const emails = (process.env.NOTIFICATION_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

  if (!apiKey || !emails.length) {
    console.warn("[Notify] Email not configured — set RESEND_API_KEY and NOTIFICATION_EMAILS");
    return false;
  }

  const rankingHtml = match.topRanking?.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr style="background:#1D4ED8;color:white"><th style="padding:8px">Pos</th><th style="padding:8px">Jugador</th><th style="padding:8px">Pts</th></tr>
        ${match.topRanking.slice(0, 5).map((r) =>
          `<tr style="background:${r.position === 1 ? '#FEF9C3' : 'white'}">
            <td style="padding:8px;text-align:center"><strong>${r.position}</strong></td>
            <td style="padding:8px">${r.displayName}</td>
            <td style="padding:8px;text-align:center;font-weight:bold">${r.points}</td>
          </tr>`
        ).join("")}
       </table>` : "";

  const body = {
    from: "Quiniela Pro <noreply@quinielapro.app>",
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
            ${match.homeTeam} <span style="color:#F59E0B">${match.homeScore} – ${match.awayScore}</span> ${match.awayTeam}
          </h2>
          <p style="text-align:center;color:#94A3B8;font-size:13px;margin:0">${match.venue ?? ""}</p>
          ${match.rankingUpdated ? `
            <div style="background:#1e293b;border-radius:8px;padding:16px;margin-top:20px">
              <h3 style="color:#F59E0B;margin:0 0 8px;font-size:14px">🏆 Ranking actualizado</h3>
              ${rankingHtml}
            </div>` : ""}
          <p style="text-align:center;margin-top:24px">
            <a href="https://quinielapro.vercel.app/rankings" style="background:#1D4ED8;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver ranking completo →</a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const ok = res.ok;
    if (!ok) console.error("[Notify] Email failed:", await res.text());
    return ok;
  } catch (err) {
    console.error("[Notify] Email error:", err);
    return false;
  }
}

// ── WhatsApp via Twilio ───────────────────────────────────────────────────

export async function sendWhatsAppNotification(match: MatchNotification): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
  const recipients = (process.env.NOTIFICATION_WHATSAPPS ?? "").split(",").map((w) => w.trim()).filter(Boolean);

  if (!sid || !token || !recipients.length) {
    console.warn("[Notify] WhatsApp not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, NOTIFICATION_WHATSAPPS");
    return false;
  }

  const topStr = match.topRanking?.length
    ? "\n🏆 *Top ranking actualizado:*\n" +
      match.topRanking.slice(0, 3).map((r) => `${r.position}. ${r.displayName} — ${r.points} pts`).join("\n")
    : "";

  const message =
    `⚽ *Quiniela Pro | FIFA WC 2026*\n\n` +
    `Partido finalizado:\n` +
    `*${match.homeTeam} ${match.homeScore} – ${match.awayScore} ${match.awayTeam}*\n` +
    (match.venue ? `📍 ${match.venue}\n` : "") +
    topStr +
    `\n\n👉 Ver ranking: https://quinielapro.vercel.app/rankings`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  let allOk = true;
  for (const to of recipients) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: from, To: to, Body: message }).toString(),
      });
      if (!res.ok) {
        console.error(`[Notify] WhatsApp failed for ${to}:`, await res.text());
        allOk = false;
      }
    } catch (err) {
      console.error(`[Notify] WhatsApp error for ${to}:`, err);
      allOk = false;
    }
  }
  return allOk;
}

// ── Combined sender ───────────────────────────────────────────────────────

export async function notifyMatchFinished(match: MatchNotification) {
  const [emailOk, waOk] = await Promise.all([
    sendEmailNotification(match),
    sendWhatsAppNotification(match),
  ]);
  return { email: emailOk, whatsapp: waOk };
}
