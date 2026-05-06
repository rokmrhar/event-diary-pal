import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

type Row = {
  id: string;
  type: string;
  recipient: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export default function EmailLogTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const badge = (s: string) => {
    if (s === "sent") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">poslano</Badge>;
    if (s === "failed") return <Badge variant="destructive">napaka</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dnevnik poslanih sporočil</h2>
          <p className="text-sm text-muted-foreground">Zadnjih 200 zapisov za revizijo delovanja sistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-3 w-3 mr-1" /> Osveži
        </Button>
      </div>
      <div className="overflow-x-auto border border-border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Čas</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Prejemnik</TableHead>
              <TableHead>Zadeva</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Napaka</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nalagam...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Ni zapisov</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("sl-SI")}</TableCell>
                <TableCell className="text-xs">{r.type}</TableCell>
                <TableCell className="text-sm">{r.recipient}</TableCell>
                <TableCell className="text-sm max-w-xs truncate">{r.subject ?? "—"}</TableCell>
                <TableCell>{badge(r.status)}</TableCell>
                <TableCell className="text-xs text-destructive max-w-sm truncate">{r.error ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}