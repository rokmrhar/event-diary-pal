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

interface Check {
  id: string;
  member_name: string;
  naslednji_pregled: string;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function daysBetween(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function buildTransporter(settings: Settings) {
  const port = settings.smtp_port ?? 587;
  // 465 = implicit TLS (secure: true). 587/25/2525 = STARTTLS (secure: false, requireTLS: true).
  const secure = port === 465 || (!!settings.smtp_secure && port !== 587 && port !== 25 && port !== 2525);
  // deno-lint-ignore no-explicit-any
  return (nodemailer as any).createTransport({
    host: settings.smtp_host!,
    port,
    secure,
    requireTLS: !secure,
    auth: settings.smtp_user && settings.smtp_pass
      ? { user: settings.smtp_user, pass: settings.smtp_pass }
      : undefined,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

function friendlyError(raw: string): string {
  if (raw.includes("wrong version number") || raw.includes("InvalidContentType") || raw.includes("corrupt message")) {
    return `${raw} — Preveri kombinacijo port/SSL: port 465 = SSL/TLS vklopljen; port 587 ali 25 = SSL/TLS izklopljen (STARTTLS).`;
  }
  if (raw.includes("ETIMEDOUT") || raw.includes("ECONNREFUSED")) {
    return `${raw} — Strežnik ne sprejema povezave. Preveri host in port.`;
  }
  if (raw.toLowerCase().includes("invalid login") || raw.includes("535")) {
    return `${raw} — Neveljavno uporabniško ime ali geslo.`;
  }
  return raw;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: { test?: boolean; recipient?: string; mode?: string } = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ ok: false, error: "Manjkajo strežniške nastavitve" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: settings, error: sErr } = await supabase
      .from("app_settings")
      .select("smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_from_name, smtp_secure, reminder_recipients, reminder_days_before, inspection_recipients, inspection_days_before")
      .limit(1)
      .maybeSingle<Settings>();
    if (sErr) throw sErr;
    if (!settings || !settings.smtp_host || !settings.smtp_from) {
      return new Response(JSON.stringify({ ok: false, message: "SMTP ni konfiguriran" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TEST MODE
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
          from,
          to,
          subject: "Testno sporočilo — PGD aplikacija",
          text: "Preizkusno sporočilo iz PGD aplikacije.",
          html: `
            <h2>Testno sporočilo</h2>
            <p>To je preizkusno sporočilo iz PGD aplikacije.</p>
            <p>Če ste ga prejeli, so SMTP nastavitve pravilne. ✅</p>
            <hr>
            <p style="color:#666;font-size:12px">Strežnik: ${settings.smtp_host}:${port}</p>
          `,
        });
        try { transporter.close(); } catch { /* ignore */ }
        return new Response(JSON.stringify({ ok: true, message: `Testno sporočilo poslano na ${to}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        const msg = friendlyError(raw);
        console.error("SMTP test send failed:", raw);
        try { transporter.close(); } catch { /* ignore */ }
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // INSPECTIONS MODE
    if (body.mode === "inspections") {
      const recipients = (settings.inspection_recipients ?? []).filter((e) => e && e.includes("@"));
      if (recipients.length === 0) {
        return new Response(JSON.stringify({ ok: false, message: "Ni prejemnikov za tehnične preglede" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const daysBefore = settings.inspection_days_before ?? 14;
      const today2 = new Date(); today2.setHours(0,0,0,0);
      const cutoff2 = new Date(today2); cutoff2.setDate(cutoff2.getDate() + daysBefore);
      const cutoffIso2 = cutoff2.toISOString().slice(0,10);
      const todayIso2 = today2.toISOString().slice(0,10);

      const { data: insp, error: iErr } = await supabase
        .from("vehicle_inspections")
        .select("id, vehicle_id, naslednji_pregled")
        .not("naslednji_pregled", "is", null)
        .gte("naslednji_pregled", todayIso2)
        .lte("naslednji_pregled", cutoffIso2);
      if (iErr) throw iErr;
      const candidates = (insp ?? []) as { id: string; vehicle_id: string; naslednji_pregled: string }[];
      if (candidates.length === 0) {
        return new Response(JSON.stringify({ ok: true, sent: 0, message: "Ni tehničnih pregledov v oknu" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const vehicleIds = [...new Set(candidates.map((c) => c.vehicle_id))];
      const { data: vehData } = await supabase.from("vehicles").select("id, oznaka, registracija").in("id", vehicleIds);
      const vehMap = new Map((vehData ?? []).map((v: { id: string; oznaka: string; registracija: string | null }) => [v.id, v]));

      const transporter = buildTransporter(settings);
      const fromName = settings.smtp_from_name || "PGD";
      const from = `"${fromName}" <${settings.smtp_from}>`;
      let sent = 0;
      for (const c of candidates) {
        const dni = daysBetween(c.naslednji_pregled);
        const v = vehMap.get(c.vehicle_id);
        const label = v ? `${v.oznaka}${v.registracija ? ` (${v.registracija})` : ""}` : "Vozilo";
        const subject = `Opomnik: tehnični pregled poteče čez ${dni} dni — ${label}`;
        const html = `
          <h2>Opomnik o tehničnem pregledu</h2>
          <p><strong>${label}</strong></p>
          <p>Naslednji tehnični pregled: <strong>${fmtDate(c.naslednji_pregled)}</strong></p>
          <p>Število dni do preteka: <strong>${dni}</strong></p>
          <hr>
          <p style="color:#666;font-size:12px">Avtomatski opomnik aplikacije PGD.</p>
        `;
        try {
          await transporter.sendMail({
            from,
            to: recipients.join(", "),
            subject,
            text: `Tehnični pregled za ${label} poteče ${fmtDate(c.naslednji_pregled)} (${dni} dni).`,
            html,
          });
          sent++;
        } catch (e) { console.error("Insp send failed", c.id, e); }
      }
      try { transporter.close(); } catch { /* ignore */ }
      return new Response(JSON.stringify({ ok: true, sent, total: candidates.length }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipients = (settings.reminder_recipients ?? []).filter((e) => e && e.includes("@"));
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: false, message: "Ni prejemnikov" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const daysBefore = settings.reminder_days_before ?? 14;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + daysBefore);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    const todayIso = today.toISOString().slice(0, 10);

    const { data: checks, error: cErr } = await supabase
      .from("medical_checks")
      .select("id, member_name, naslednji_pregled")
      .not("naslednji_pregled", "is", null)
      .gte("naslednji_pregled", todayIso)
      .lte("naslednji_pregled", cutoffIso);
    if (cErr) throw cErr;

    const candidates = (checks ?? []) as Check[];
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "Ni pregledov v oknu" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = candidates.map((c) => c.id);
    const { data: logged } = await supabase
      .from("medical_reminder_log")
      .select("medical_check_id, naslednji_pregled")
      .in("medical_check_id", ids);
    const already = new Set((logged ?? []).map((l: { medical_check_id: string; naslednji_pregled: string }) => `${l.medical_check_id}|${l.naslednji_pregled}`));
    const toSend = candidates.filter((c) => !already.has(`${c.id}|${c.naslednji_pregled}`));

    if (toSend.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "Vsi opomniki že poslani" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = buildTransporter(settings);
    const fromName = settings.smtp_from_name || "PGD";
    const from = `"${fromName}" <${settings.smtp_from}>`;

    let sent = 0;
    for (const c of toSend) {
      const dni = daysBetween(c.naslednji_pregled);
      const subject = `Opomnik: zdravniški pregled poteče čez ${dni} dni — ${c.member_name}`;
      const html = `
        <h2>Opomnik o zdravniškem pregledu</h2>
        <p><strong>${c.member_name}</strong></p>
        <p>Naslednji zdravniški pregled: <strong>${fmtDate(c.naslednji_pregled)}</strong></p>
        <p>Število dni do preteka: <strong>${dni}</strong></p>
        <hr>
        <p style="color:#666;font-size:12px">Avtomatski opomnik aplikacije PGD.</p>
      `;
      try {
        await transporter.sendMail({
          from,
          to: recipients.join(", "),
          subject,
          text: `Opomnik: zdravniški pregled za ${c.member_name} poteče ${fmtDate(c.naslednji_pregled)} (${dni} dni).`,
          html,
        });
        await supabase.from("medical_reminder_log").insert({
          medical_check_id: c.id,
          naslednji_pregled: c.naslednji_pregled,
          recipients,
        });
        sent++;
      } catch (e) {
        console.error("Send failed for", c.id, e);
      }
    }

    try { transporter.close(); } catch { /* ignore */ }

    return new Response(JSON.stringify({ ok: true, sent, total: toSend.length }), {
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
