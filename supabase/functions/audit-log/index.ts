import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || null;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").slice(0, 100);
    const details = body?.details != null ? String(body.details).slice(0, 2000) : null;
    if (!action) return json({ error: "action required" }, 400);

    let userId: string | null = null;
    let username: string | null = null;
    const auth = req.headers.get("Authorization");
    const token = auth?.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await admin.auth.getUser(token);
      if (data?.user) { userId = data.user.id; username = data.user.email ?? null; }
    }

    if (action === "login_failed") {
      await admin.from("audit_log").insert({ action, ip, username: String(body?.username ?? "").slice(0, 200), details, success: false });
      return json({ ok: true });
    }
    if (!userId) return json({ error: "Unauthorized" }, 401);

    if (action === "delete_user") {
      const { data: r } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!r) return json({ error: "Forbidden: admin only" }, 403);
      const target = String(body?.user_id ?? "");
      if (!target) return json({ error: "user_id required" }, 400);
      if (target === userId) return json({ error: "Ne morete izbrisati sebe." }, 400);
      const { data: t } = await admin.auth.admin.getUserById(target);
      const { error } = await admin.auth.admin.deleteUser(target);
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").delete().eq("user_id", target);
      await admin.from("user_module_permissions").delete().eq("user_id", target);
      await admin.from("audit_log").insert({ action: "Izbris uporabnika", ip, user_id: userId, username, details: t?.user?.email ?? target });
      return json({ ok: true });
    }

    await admin.from("audit_log").insert({ action, ip, user_id: userId, username, details });
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
