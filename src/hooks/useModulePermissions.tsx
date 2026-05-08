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
  { key: "medical", label: "Zdravniški pregledi" },
  { key: "statistics", label: "Statistika" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];
export type PermLevel = "view" | "edit";

/**
 * Returns module access map { module -> 'view' | 'edit' }.
 * Admins implicitly get 'edit' for every module.
 */
export function useModulePermissions() {
  const { user, isAdmin } = useAuth();
  const [levels, setLevels] = useState<Record<string, PermLevel>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLevels({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_module_permissions")
      .select("module, level")
      .eq("user_id", user.id);
    if (!error && data) {
      const map: Record<string, PermLevel> = {};
      for (const r of data as { module: string; level: PermLevel }[]) {
        map[r.module] = r.level ?? "edit";
      }
      setLevels(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canView = useCallback(
    (module: string) => isAdmin || !!levels[module],
    [isAdmin, levels]
  );
  const canEdit = useCallback(
    (module: string) => isAdmin || levels[module] === "edit",
    [isAdmin, levels]
  );

  // Backward-compat: existing `permissions` Set semantically meant "can edit".
  const permissions = new Set(
    Object.entries(levels).filter(([, v]) => v === "edit").map(([k]) => k)
  );

  return { permissions, levels, canView, canEdit, loading, refresh };
}