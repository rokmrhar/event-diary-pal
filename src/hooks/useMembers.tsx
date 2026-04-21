import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Member = { id: string; name: string };

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("id, name");
    if (!error && data) {
      const sorted = [...(data as Member[])].sort((a, b) =>
        getSurname(a.name).localeCompare(getSurname(b.name), "sl") ||
        a.name.localeCompare(b.name, "sl")
      );
      setMembers(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { members, loading, refresh };
}

// Priimek = prva beseda za imenom (npr. "Janez Novak" -> "Novak",
// "Janez Novak Kovač" -> "Novak"). Pri enobesednih vnosih vrne celoto.
function getSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return parts[1];
}