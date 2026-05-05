import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const MODULES = [
  { key: "activities", label: "Aktivnosti" },
  { key: "interventions", label: "Intervencije" },
  { key: "ida", label: "IDA" },
  { key: "mass_events", label: "Dogodek večjega obsega" },
  { key: "vehicles", label: "Vozila" },
  { key: "services", label: "Servisi" },
  { key: "inspections", label: "Tehnični pregledi" },
  { key: "cylinder_fillings", label: "Polnjenja posod" },
  { key: "pranja", label: "Pranja" },
  { key: "potni_nalog", label: "Potni nalog" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

/**
 * Returns the set of module keys the current user can edit.
 * Admins always have all permissions.
 */
export function useModulePermissions() {
  const { user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_module_permissions")
      .select("module")
      .eq("user_id", user.id);
    if (!error && data) {
      setPermissions(new Set(data.map((d: { module: string }) => d.module)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canEdit = useCallback(
    (module: ModuleKey) => isAdmin || permissions.has(module),
    [isAdmin, permissions]
  );

  return { permissions, canEdit, loading, refresh };
}