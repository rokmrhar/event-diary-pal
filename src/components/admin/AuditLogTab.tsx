import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

type Row = {
  id: string;
  created_at: string;
  username: string | null;
  ip: string | null;
  action: string;
  details: string | null;
  success: boolean;
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export default function AuditLogTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const s = q.toLowerCase();
  const visible = rows.filter((r) =>
    [r.username, r.ip, r.action, r.details].some((v) => (v ?? "").toLowerCase().includes(s)),
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Išči po uporabniku, IP, aktivnosti..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="outline" onClick={load} aria-label="Osveži"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Nalagam...</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Čas</th>
                <th className="p-2">Uporabnik</th>
                <th className="p-2">IP naslov</th>
                <th className="p-2">Aktivnost</th>
                <th className="p-2">Podrobnosti</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-2 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="p-2">{r.username || "—"}</td>
                  <td className="p-2 font-mono text-xs">{r.ip || "—"}</td>
                  <td className="p-2">
                    {r.success ? r.action : <Badge variant="destructive">Napačna prijava</Badge>}
                  </td>
                  <td className="p-2 text-muted-foreground break-all">{r.details}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Ni zapisov.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
