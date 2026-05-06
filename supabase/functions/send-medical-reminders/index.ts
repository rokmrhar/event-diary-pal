import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import nodemailer from "npm:nodemailer@6.9.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Settings {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  smtp_from: string | null;
  smtp_from_name: string | null;
  smtp_secure: boolean | null;
  reminder_recipients: string[] | null;
  reminder_days_before: number | null;
  inspection_recipients: string[] | null;
  inspection_days_before: number | null;
}

interface Check { id: string; member_name: string; naslednji_pregled: string; }

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
function daysBetween(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
function renderTpl(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ""));
}
// deno-lint-ignore no-explicit-any
async function logEmail(supabase: any, type: string, recipient: string, subject: string, status: string, error?: string, related_id?: string) {
  try {
    await supabase.from("email_log").insert({ type, recipient, subject, status, error: error ?? null, related_id: related_id ?? null });
  } catch (e) { console.error("log fail", e); }
}

function buildTransporter(settings: Settings) {
  const port = settings.smtp_port ?? 587;
  const secure = port === 465 || (!!settings.smtp_secure && port !== 587 && port !== 25 && port !== 2525);
  // deno-lint-ignore no-explicit-any
  return (nodemailer as any).createTransport({
    host: settings.smtp_host!,
    port,
    secure,
    requireTLS: !secure,
    auth: settings.smtp_user && settings.smtp_pass ? { user: settings.smtp_user, pass: settings.smtp_pass } : undefined,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000, greetingTimeout: 10000, socketTimeout: 20000,
  });
}

function friendlyError(raw: string): string {
  if (raw.includes("wrong version number") || raw.includes("InvalidContentType") || raw.includes("corrupt message")) {
    return `${raw} — Preveri kombinacijo port/SSL: 465=SSL, 587/25=STARTTLS.`;
  }
  if (raw.includes("ETIMEDOUT") || raw.includes("ECONNREFUSED")) return `${raw} — Strežnik ne sprejema povezave.`;
  if (raw.toLowerCase().includes("invalid login") || raw.includes("535")) return `${raw} — Neveljavno uporabniško ime ali geslo.`;
  return raw;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: { test?: boolean; recipient?: string; mode?: string; cron?: boolean } = {};
    if (req.method === "POST") { try { body = await req.json(); } catch { body = {}; } }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ ok: false, error: "Manjkajo strežniške nastavitve" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: settings } = await supabase
      .from("app_settings")
      .select("smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_from_name, smtp_secure, reminder_recipients, reminder_days_before, inspection_recipients, inspection_days_before")
      .limit(1).maybeSingle<Settings>();
    if (!settings || !settings.smtp_host || !settings.smtp_from) {
      return new Response(JSON.stringify({ ok: false, message: "SMTP ni konfiguriran" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.test) {
      const to = (body.recipient ?? "").trim();
      if (!to.includes("@")) {
        return new Response(JSON.stringify({ ok: false, error: "Neveljaven prejemnik" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const transporter = buildTransporter(settings);
      const fromName = settings.smtp_from_name || "PGD";
      const from = `"${fromName}" <${settings.smtp_from}>`;
      const port = settings.smtp_port ?? 587;
      try {
        await transporter.verify();
        await transporter.sendMail({
          from, to, subject: "Testno sporočilo — PGD aplikacija",
          text: "Preizkusno sporočilo iz PGD aplikacije.",
          html: `<h2>Testno sporočilo</h2><p>To je preizkusno sporočilo iz PGD aplikacije.</p><p>Če ste ga prejeli, so SMTP nastavitve pravilne. ✅</p><hr><p style="color:#666;font-size:12px">Strežnik: ${settings.smtp_host}:${port}</p>`,
        });
        try { transporter.close(); } catch { /* ignore */ }
        await logEmail(supabase, "test", to, "Testno sporočilo — PGD aplikacija", "sent");
        return new Response(JSON.stringify({ ok: true, message: `Testno sporočilo poslano na ${to}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        const msg = friendlyError(raw);
        try { transporter.close(); } catch { /* ignore */ }
        await logEmail(supabase, "test", to, "Testno sporočilo — PGD aplikacija", "failed", msg);
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: tplData } = await supabase.from("email_templates").select("key, subject, body_html");
    const tplMap = new Map<string, { subject: string; body_html: string }>();
    // deno-lint-ignore no-explicit-any
    for (const t of (tplData ?? []) as any[]) tplMap.set(t.key, { subject: t.subject, body_html: t.body_html });

    const { data: schedData } = await supabase.from("email_schedules").select("*");
    // deno-lint-ignore no-explicit-any
    const schedules = (schedData ?? []) as any[];

    if (body.cron) {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const results: { type: string; sent: number }[] = [];
      for (const s of schedules) {
        if (!s.enabled || s.hour !== currentHour) continue;
        if (s.last_run_at) {
          const last = new Date(s.last_run_at);
          const diffDays = (now.getTime() - last.getTime()) / 86400000;
          if (diffDays < s.interval_days - 0.05) continue;
        }
        const r = await runJob(supabase, settings, tplMap, s.type, s.days_before);
        results.push({ type: s.type, sent: r });
        await supabase.from("email_schedules").update({ last_run_at: now.toISOString() }).eq("id", s.id);
      }
      return new Response(JSON.stringify({ ok: true, results }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual mode by type. Backwards compat: "inspections" -> "tehnicni"
    let mode = body.mode ?? "zdravniski";
    if (mode === "inspections") mode = "tehnicni";
    const sched = schedules.find((s) => s.type === mode);
    const sent = await runJob(supabase, settings, tplMap, mode, sched?.days_before);
    if (sched) await supabase.from("email_schedules").update({ last_run_at: new Date().toISOString() }).eq("id", sched.id);
    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-medical-reminders error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// deno-lint-ignore no-explicit-any
async function runJob(supabase: any, settings: Settings, tplMap: Map<string, { subject: string; body_html: string }>, type: string, daysBeforeOverride?: number): Promise<number> {
  const transporter = buildTransporter(settings);
  const fromName = settings.smtp_from_name || "PGD";
  const from = `"${fromName}" <${settings.smtp_from}>`;
  const today = new Date(); today.setHours(0,0,0,0);
  const todayIso = today.toISOString().slice(0,10);
  let sent = 0;

  try {
    if (type === "zdravniski") {
      const recipients = (settings.reminder_recipients ?? []).filter((e) => e && e.includes("@"));
      if (recipients.length === 0) return 0;
      const daysBefore = daysBeforeOverride ?? settings.reminder_days_before ?? 14;
      const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + daysBefore);
      const cutoffIso = cutoff.toISOString().slice(0,10);
      const { data: checks } = await supabase
        .from("medical_checks").select("id, member_name, naslednji_pregled")
        .not("naslednji_pregled", "is", null).gte("naslednji_pregled", todayIso).lte("naslednji_pregled", cutoffIso);
      const candidates = (checks ?? []) as Check[];
      const ids = candidates.map((c) => c.id);
      const { data: logged } = await supabase.from("medical_reminder_log").select("medical_check_id, naslednji_pregled").in("medical_check_id", ids);
      // deno-lint-ignore no-explicit-any
      const already = new Set((logged ?? []).map((l: any) => `${l.medical_check_id}|${l.naslednji_pregled}`));
      const toSend = candidates.filter((c) => !already.has(`${c.id}|${c.naslednji_pregled}`));
      const tpl = tplMap.get("zdravniski");
      for (const c of toSend) {
        const dni = daysBetween(c.naslednji_pregled);
        const vars = { ime: c.member_name, datum: fmtDate(c.naslednji_pregled), dni };
        const subject = tpl ? renderTpl(tpl.subject, vars) : `Opomnik: zdravniški pregled — ${c.member_name}`;
        const html = tpl ? renderTpl(tpl.body_html, vars) : `<p>${c.member_name}</p>`;
        try {
          await transporter.sendMail({ from, to: recipients.join(", "), subject, html });
          await supabase.from("medical_reminder_log").insert({ medical_check_id: c.id, naslednji_pregled: c.naslednji_pregled, recipients });
          await logEmail(supabase, "zdravniski", recipients.join(", "), subject, "sent", undefined, c.id);
          sent++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await logEmail(supabase, "zdravniski", recipients.join(", "), subject, "failed", msg, c.id);
        }
      }
    } else if (type === "tehnicni") {
      const recipients = (settings.inspection_recipients ?? []).filter((e) => e && e.includes("@"));
      if (recipients.length === 0) return 0;
      const daysBefore = daysBeforeOverride ?? settings.inspection_days_before ?? 14;
      const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + daysBefore);
      const cutoffIso = cutoff.toISOString().slice(0,10);
      const { data: insp } = await supabase
        .from("vehicle_inspections").select("id, vehicle_id, naslednji_pregled")
        .not("naslednji_pregled", "is", null).gte("naslednji_pregled", todayIso).lte("naslednji_pregled", cutoffIso);
      // deno-lint-ignore no-explicit-any
      const cands = (insp ?? []) as any[];
      const vehIds = [...new Set(cands.map((c) => c.vehicle_id))];
      const { data: vehData } = await supabase.from("vehicles").select("id, oznaka, registracija").in("id", vehIds);
      // deno-lint-ignore no-explicit-any
      const vehMap = new Map((vehData ?? []).map((v: any) => [v.id, v]));
      const tpl = tplMap.get("tehnicni");
      for (const c of cands) {
        // deno-lint-ignore no-explicit-any
        const v = vehMap.get(c.vehicle_id) as any;
        const label = v ? `${v.oznaka}${v.registracija ? ` (${v.registracija})` : ""}` : "Vozilo";
        const dni = daysBetween(c.naslednji_pregled);
        const vars = { vozilo: label, datum: fmtDate(c.naslednji_pregled), dni };
        const subject = tpl ? renderTpl(tpl.subject, vars) : `Opomnik: tehnični pregled — ${label}`;
        const html = tpl ? renderTpl(tpl.body_html, vars) : `<p>${label}</p>`;
        try {
          await transporter.sendMail({ from, to: recipients.join(", "), subject, html });
          await logEmail(supabase, "tehnicni", recipients.join(", "), subject, "sent", undefined, c.id);
          sent++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await logEmail(supabase, "tehnicni", recipients.join(", "), subject, "failed", msg, c.id);
        }
      }
    } else if (type === "nacrtovanja") {
      const daysBefore = daysBeforeOverride ?? 14;
      const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + daysBefore);
      const cutoffIso = cutoff.toISOString().slice(0,10);
      const { data: plans } = await supabase
        .from("medical_plans")
        .select("id, member_name, member_email, planned_date, location, opombe, reminder_sent_at")
        .not("planned_date", "is", null).gte("planned_date", todayIso).lte("planned_date", cutoffIso)
        .is("reminder_sent_at", null);
      const tpl = tplMap.get("nacrtovanje");
      // deno-lint-ignore no-explicit-any
      for (const p of (plans ?? []) as any[]) {
        if (!p.member_email || !p.member_email.includes("@")) continue;
        const vars = { ime: p.member_name, datum: fmtDate(p.planned_date), lokacija: p.location ?? "", opombe: p.opombe ?? "" };
        const subject = tpl ? renderTpl(tpl.subject, vars) : `Načrtovan zdravniški pregled — ${fmtDate(p.planned_date)}`;
        const html = tpl ? renderTpl(tpl.body_html, vars) : `<p>${p.member_name}</p>`;
        try {
          await transporter.sendMail({ from, to: p.member_email, subject, html });
          await supabase.from("medical_plans").update({ reminder_sent_at: new Date().toISOString() }).eq("id", p.id);
          await logEmail(supabase, "nacrtovanje", p.member_email, subject, "sent", undefined, p.id);
          sent++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await logEmail(supabase, "nacrtovanje", p.member_email, subject, "failed", msg, p.id);
        }
      }
    }
  } finally {
    try { transporter.close(); } catch { /* ignore */ }
  }
  return sent;
}
