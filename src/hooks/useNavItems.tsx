import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = {
  id: string;
  kind: "link" | "separator";
  label: string;
  url: string | null;
  icon: string | null;
  module_key: string | null;
  external: boolean;
  visible: boolean;
  sort_order: number;
};

export function useNavItems() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nav_items")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data ?? []) as NavItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}