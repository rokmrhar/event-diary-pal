import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Pencil, Plus, Trash2, Gauge } from "lucide-react";
import { formatDateSI } from "@/lib/format";

type Posoda = { id: string; interna_st: string };
type Polnjenje = {
  id: string;
  user_id: string;
  posoda_id: string;
  datum: string;
  polnil: string;
  opombe: string | null;
  created_at: string;
};

export default function IdaPolnjenja() {
  const { user } = useAuth();
  const { members } = useMembers();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("cylinder_fillings");

  const [posode, setPosode] = useState<Posoda[]>([]);
  const [rows, setRows] = useState<Polnjenje[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPosoda, setFilterPosoda] = useState<string>("vse");
  const [filterPolnil, setFilterPolnil] = useState<string>("vsi");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Polnjenje | null>(null);
  const [fDatum, setFDatum] = useState(new Date().toISOString().slice(0, 10));
  const [fPosoda, setFPosoda] = useState("");
  const [fPolnil, setFPolnil] = useState("");
  const [fOpombe, setFOpombe] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [pRes, rRes] = await Promise.all([
      supabase.from("ida_tlacne_posode").select("id, interna_st").order("interna_st"),
      supabase.from("tlacne_posode_polnjenja").select("*").order("datum", { ascending: false }),
    ]);
    setPosode((pRes.data ?? []) as Posoda[]);
    setRows((rRes.data ?? []) as Polnjenje[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const posodaById = useMemo(() => {
    const m: Record<string, string> = {};
    posode.forEach((p) => (m[p.id] = p.interna_st));
    return m;
  }, [posode]);

  // Compute zaporedna št. polnjenja per posoda (1, 2, 3...) by date asc + created_at
  const seqByRow = useMemo(() => {
    const map: Record<string, number> = {};
    const grouped: Record<string, Polnjenje[]> = {};
    rows.forEach((r) => (grouped[r.posoda_id] ??= []).push(r));
    Object.values(grouped).forEach((list) => {
      const sorted = [...list].sort((a, b) =>
        a.datum === b.datum
          ? a.created_at.localeCompare(b.created_at)
          : a.datum.localeCompare(b.datum)
      );
      sorted.forEach((r, idx) => {
        map[r.id] = idx + 1;
      });
    });
    return map;
  }, [rows]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (filterPosoda !== "vse" && r.posoda_id !== filterPosoda) return false;
      if (filterPolnil !== "vsi" && r.polnil !== filterPolnil) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const posodaSt = posodaById[r.posoda_id] ?? "";
      return (
        posodaSt.toLowerCase().includes(q) ||
        r.polnil.toLowerCase().includes(q) ||
        (r.opombe ?? "").toLowerCase().includes(q) ||
        r.datum.includes(q)
      );
    });
  }, [rows, filterPosoda, filterPolnil, search, posodaById]);

  const openCreate = () => {
    setEditing(null);
    setFDatum(new Date().toISOString().slice(0, 10));
    setFPosoda("");
    setFPolnil("");
    setFOpombe("");
    setOpen(true);
  };

  const openEdit = (r: Polnjenje) => {
    setEditing(r);
    setFDatum(r.datum);
    setFPosoda(r.posoda_id);
    setFPolnil(r.polnil);
    setFOpombe(r.opombe ?? "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fPosoda || !fPolnil.trim() || !fDatum) {
      toast({ title: "Manjkajoči podatki", description: "Izberi posodo, polnitelja in datum.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("tlacne_posode_polnjenja")
        .update({
          posoda_id: fPosoda,
          datum: fDatum,
          polnil: fPolnil.trim(),
          opombe: fOpombe.trim() || null,
        })
        .eq("id", editing.id);
      setSaving(false);
      if (error) {
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("tlacne_posode_polnjenja").insert({
        user_id: user.id,
        posoda_id: fPosoda,
        datum: fDatum,
        polnil: fPolnil.trim(),
        opombe: fOpombe.trim() || null,
      });
      setSaving(false);
      if (error) {
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Polnjenje shranjeno" });
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (r: Polnjenje) => {
    if (!confirm("Izbriši polnjenje?")) return;
    const { error } = await supabase.from("tlacne_posode_polnjenja").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Izbrisano" });
    load();
  };

  const uniquePolnili = Array.from(new Set(rows.map((r) => r.polnil))).sort();

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/ida"><ArrowLeft className="h-4 w-4 mr-1" /> IDA</Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Gauge className="h-6 w-6 text-brand-red" />
              Polnjenja tlačnih posod
            </h1>
          </div>
          {allowed && (
            <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Plus className="h-4 w-4 mr-1" /> Novo polnjenje
            </Button>
          )}
        </div>

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Nimaš pravic za urejanje. Zapise lahko samo pregleduješ.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Išči..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterPosoda} onValueChange={setFilterPosoda}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vse">Vse posode</SelectItem>
              {posode.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.interna_st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPolnil} onValueChange={setFilterPolnil}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vsi">Vsi polnitelji</SelectItem>
              {uniquePolnili.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Št. posode</TableHead>
                <TableHead className="text-center">Stanje št.</TableHead>
                <TableHead>Polnil</TableHead>
                <TableHead>Opombe</TableHead>
                {allowed && <TableHead className="text-right w-[120px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nalagam...</TableCell></TableRow>
              ) : visible.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Ni zapisov</TableCell></TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDateSI(r.datum)}</TableCell>
                    <TableCell className="font-medium">{posodaById[r.posoda_id] ?? "—"}</TableCell>
                    <TableCell className="text-center">{seqByRow[r.id]}</TableCell>
                    <TableCell>{r.polnil}</TableCell>
                    <TableCell className="text-muted-foreground">{r.opombe ?? "—"}</TableCell>
                    {allowed && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(r)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Uredi polnjenje" : "Novo polnjenje"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Datum *</Label>
                <Input type="date" value={fDatum} onChange={(e) => setFDatum(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Št. posode *</Label>
                <Select value={fPosoda} onValueChange={setFPosoda}>
                  <SelectTrigger><SelectValue placeholder="Izberi posodo" /></SelectTrigger>
                  <SelectContent>
                    {posode.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.interna_st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Polnil *</Label>
                <Select value={fPolnil} onValueChange={setFPolnil}>
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
                <Textarea rows={3} value={fOpombe} onChange={(e) => setFOpombe(e.target.value)} />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Prekliči</Button>
                <Button type="submit" disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  {saving ? "Shranjujem..." : editing ? "Posodobi" : "Shrani"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}