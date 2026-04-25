import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatDateSI } from "@/lib/format";

type Pranje = {
  id: string;
  user_id: string;
  datum: string;
  oprema: string;
  programi: string[];
  dal_prat: string;
  opombe: string | null;
};

export default function ArhivPranj() {
  const { user, isAdmin } = useAuth();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("pranja");
  const [rows, setRows] = useState<Pranje[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pranja")
      .select("*")
      .order("datum", { ascending: false });
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
    } else {
      setRows(((data ?? []) as unknown as Pranje[]).map((r) => ({
        ...r,
        programi: Array.isArray(r.programi) ? r.programi : [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.oprema.toLowerCase().includes(q) ||
      r.dal_prat.toLowerCase().includes(q) ||
      r.programi.some((p) => p.toLowerCase().includes(q)) ||
      (r.opombe ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleDelete = async (r: Pranje) => {
    if (!confirm("Izbriši zapis pranja?")) return;
    const { error } = await supabase.from("pranja").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Izbrisano" });
    load();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/pranja"><ArrowLeft className="h-4 w-4 mr-1" /> Nazaj</Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase">Arhiv pranj</h1>
          </div>
          {allowed && (
            <Button asChild className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Link to="/pranja/vnos">Novo pranje</Link>
            </Button>
          )}
        </div>

        <Input
          placeholder="Išči po opremi, programu, osebi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Oprema / oblačilo</TableHead>
                <TableHead>Programi</TableHead>
                <TableHead>Dal prat</TableHead>
                <TableHead>Opombe</TableHead>
                {allowed && <TableHead className="text-right w-[100px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nalagam...</TableCell></TableRow>
              ) : visible.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Ni zapisov</TableCell></TableRow>
              ) : (
                visible.map((r) => {
                  const canDel = isAdmin || r.user_id === user?.id;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{formatDateSI(r.datum)}</TableCell>
                      <TableCell className="font-medium">{r.oprema}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {r.programi.map((p, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{r.dal_prat}</TableCell>
                      <TableCell className="text-muted-foreground">{r.opombe ?? "—"}</TableCell>
                      {allowed && (
                        <TableCell className="text-right">
                          {canDel && (
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}