import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Parse optional body for test mode
    let body: { test?: boolean; recipient?: string } = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Load settings
    const { data: settings, error: sErr } = await supabase
      .from("app_settings")
      .select("smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_from_name, smtp_secure, reminder_recipients, reminder_days_before")
      .limit(1)
      .maybeSingle<Settings>();
    if (sErr) throw sErr;
    if (!settings || !settings.smtp_host || !settings.smtp_from) {
      return new Response(JSON.stringify({ ok: false, message: "SMTP ni konfiguriran" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TEST MODE: send a single test email to a chosen address
    if (body.test) {
      const to = (body.recipient ?? "").trim();
      if (!to.includes("@")) {
        return new Response(JSON.stringify({ ok: false, error: "Neveljaven prejemnik" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const port = settings.smtp_port ?? 587;
      // Auto-detect TLS mode: port 465 = implicit TLS, others (587/25/2525) = STARTTLS (tls:false)
      const useImplicitTls = port === 465 || (!!settings.smtp_secure && port !== 587 && port !== 25 && port !== 2525);
      const client = new SMTPClient({
        connection: {
          hostname: settings.smtp_host,
          port,
          tls: useImplicitTls,
          auth: settings.smtp_user && settings.smtp_pass ? { username: settings.smtp_user, password: settings.smtp_pass } : undefined,
        },
      });
      const fromName = settings.smtp_from_name || "PGD";
      const from = `${fromName} <${settings.smtp_from}>`;
      try {
        await client.send({
          from,
          to: [to],
          subject: "Testno sporočilo — PGD aplikacija",
          content: "auto",
          html: `
            <h2>Testno sporočilo</h2>
            <p>To je preizkusno sporočilo iz PGD aplikacije.</p>
            <p>Če ste ga prejeli, so SMTP nastavitve pravilne. ✅</p>
            <hr>
            <p style="color:#666;font-size:12px">Strežnik: ${settings.smtp_host}:${port} (${useImplicitTls ? "TLS" : "STARTTLS"})</p>
          `,
        });
        await client.close();
        return new Response(JSON.stringify({ ok: true, message: `Testno sporočilo poslano na ${to}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        let msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("InvalidContentType") || msg.includes("corrupt message")) {
          msg = `Napaka TLS rokovanja (${msg}). Preveri kombinacijo port/SSL: port 465 = SSL/TLS vklopljen; port 587 ali 25 = SSL/TLS izklopljen (uporabi STARTTLS).`;
        }
        console.error("SMTP test send failed:", msg);
        try { await client.close(); } catch { /* ignore */ }
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const recipients = (settings.reminder_recipients ?? []).filter((e) => e && e.includes("@"));
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: false, message: "Ni prejemnikov" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const daysBefore = settings.reminder_days_before ?? 14;

    // 2. Find checks expiring within window
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

    // 3. Filter out already-sent (per medical_check_id + naslednji_pregled)
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

    // 4. Connect SMTP
    const port = settings.smtp_port ?? 587;
    const client = new SMTPClient({
      connection: {
        hostname: settings.smtp_host,
        port,
        tls: !!settings.smtp_secure,
        auth: settings.smtp_user && settings.smtp_pass ? { username: settings.smtp_user, password: settings.smtp_pass } : undefined,
      },
    });

    const fromName = settings.smtp_from_name || "PGD";
    const from = `${fromName} <${settings.smtp_from}>`;

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
        await client.send({
          from,
          to: recipients,
          subject,
          content: "auto",
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

    await client.close();

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