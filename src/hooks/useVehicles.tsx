import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Vehicle = {
  id: string;
  oznaka: string;
  registracija: string | null;
  znamka: string | null;
  model: string | null;
  st_sedezev: number | null;
  opombe: string | null;
  user_id: string;
};

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .order("oznaka", { ascending: true });
    setVehicles((data as Vehicle[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { vehicles, loading, refresh };
}