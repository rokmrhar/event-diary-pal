import { useEffect, useState } from "react";
import IdaEvidencaApp, { IdaField } from "@/components/ida/IdaEvidencaApp";
import { supabase } from "@/integrations/supabase/client";

const FIELDS: IdaField[] = [
  { key: "interna_st", label: "Interna št.", type: "text", required: true },
  { key: "proizvajalec", label: "Proizvajalec", type: "text" },
  { key: "vrsta", label: "Vrsta posode", type: "select", options: ["kompozit", "jeklena"] },
  { key: "serijska_st", label: "Serijska št.", type: "text" },
  { key: "leto_proizvodnje", label: "Leto proizvodnje", type: "year" },
  { key: "kapaciteta_l", label: "Kapaciteta", type: "number", suffix: "L" },
  { key: "tlak_bar", label: "Tlak", type: "number", suffix: "bar" },
  { key: "datum_zadnjega_pregleda", label: "Zadnji pregled", type: "month" },
  { key: "datum_veljavnosti_pregleda", label: "Velja do", type: "month" },
  { key: "opombe", label: "Opombe", type: "textarea" },
];

export default function IdaTlacnePosode() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tlacne_posode_polnjenja")
        .select("posoda_id");
      if (cancelled || !data) return;
      const map: Record<string, number> = {};
      for (const r of data as { posoda_id: string }[]) {
        map[r.posoda_id] = (map[r.posoda_id] ?? 0) + 1;
      }
      setCounts(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <IdaEvidencaApp
      title="Tlačne posode"
      table="ida_tlacne_posode"
      fields={FIELDS}
      primaryKey="interna_st"
      extraColumn={{
        label: "Št. polnjenj",
        render: (row) => counts[row.id as string] ?? 0,
      }}
      rowClassName={(row) => {
        const v = String(row.vrsta ?? "").toLowerCase();
        if (v === "kompozit") return "bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-950/50";
        if (v === "jeklena") return "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50";
        return undefined;
      }}
    />
  );
}