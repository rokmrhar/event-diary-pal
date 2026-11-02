import { supabase } from "@/integrations/supabase/client";

export async function logAudit(action: string, details?: string, extra?: Record<string, unknown>) {
  try {
    await supabase.functions.invoke("audit-log", { body: { action, details, ...extra } });
  } catch {
    // logging must never break the app
  }
}
