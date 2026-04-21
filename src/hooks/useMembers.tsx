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

// Priimek = zadnja beseda v imenu (npr. "Janez Novak" -> "Novak")
function getSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}