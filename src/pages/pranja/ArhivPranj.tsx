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
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PRANJA_PROGRAMI } from "@/lib/pranja";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembers } from "@/hooks/useMembers";
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
  const { members } = useMembers();
  const allowed = canEdit("pranja");
  const [rows, setRows] = useState<Pranje[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Pranje | null>(null);
  const [eDatum, setEDatum] = useState("");
  const [eOprema, setEOprema] = useState("");
  const [eProgrami, setEProgrami] = useState<string[]>([]);
  const [eDal, setEDal] = useState("");
  const [eOpombe, setEOpombe] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEdit = (r: Pranje) => {
    setEditing(r);
    setEDatum(r.datum);
    setEOprema(r.oprema);
    setEProgrami(r.programi);
    setEDal(r.dal_prat);
    setEOpombe(r.opombe ?? "");
  };
  const toggleEProgram = (p: string) =>
    setEProgrami((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const { error } = await supabase.from("pranja").update({
      datum: eDatum,
      oprema: eOprema.trim(),
      programi: eProgrami,
      dal_prat: eDal,
      opombe: eOpombe.trim() || null,
    }).eq("id", editing.id);
    setSavingEdit(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Posodobljeno" });
    setEditing(null);
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
                  const canEditRow = isAdmin;
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
                          <div className="flex justify-end gap-1">
                            {canEditRow && (
                              <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDel && (
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(r)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Uredi zapis pranja</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Datum</Label>
                  <Input type="date" value={eDatum} onChange={(e) => setEDatum(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Oprema / oblačilo</Label>
                  <Input value={eOprema} onChange={(e) => setEOprema(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Programi ({eProgrami.length})</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-border rounded-xl p-3 text-sm bg-muted/40 max-h-60 overflow-auto">
                  {PRANJA_PROGRAMI.map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={eProgrami.includes(p)} onCheckedChange={() => toggleEProgram(p)} />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Dal/-a prat</Label>
                <Select value={eDal} onValueChange={setEDal}>
                  <SelectTrigger><SelectValue placeholder="Izberi gasilca" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Opombe</Label>
                <Textarea rows={3} value={eOpombe} onChange={(e) => setEOpombe(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>Prekliči</Button>
              <Button onClick={saveEdit} disabled={savingEdit} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                {savingEdit ? "Shranjujem..." : "Shrani"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}