import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useVehicles } from "@/hooks/useVehicles";

type Row = {
  id: string;
  user_id: string;
  vozilo: string | null;
  hrbtisce_id: string | null;
  pljucni_avtomat_id: string | null;
};

type Hrb = { id: string; serijska_st: string | null; interna_st: string };
type PA = { id: string; serijska_st: string | null; naziv: string | null };

const NONE = "__none__";

export default function IdaSeznamVozil() {
  const { user } = useAuth();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("ida");
  const { vehicles } = useVehicles();

  const [rows, setRows] = useState<Row[]>([]);
  const [hrbtisca, setHrbtisca] = useState<Hrb[]>([]);
  const [avtomati, setAvtomati] = useState<PA[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ vozilo: "", hrbtisce_id: "", pljucni_avtomat_id: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [v, h, p] = await Promise.all([
      supabase.from("ida_vozila").select("id, user_id, vozilo, hrbtisce_id, pljucni_avtomat_id").order("created_at", { ascending: false }),
      supabase.from("ida_hrbtisca").select("id, serijska_st, interna_st").order("interna_st"),
      supabase.from("ida_pljucni_avtomati").select("id, serijska_st, naziv").order("naziv"),
    ]);
    if (v.error) toast({ title: "Napaka", description: v.error.message, variant: "destructive" });
    setRows((v.data ?? []) as Row[]);
    setHrbtisca((h.data ?? []) as Hrb[]);
    setAvtomati((p.data ?? []) as PA[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const hrbMap = useMemo(() => new Map(hrbtisca.map((h) => [h.id, h])), [hrbtisca]);
  const paMap = useMemo(() => new Map(avtomati.map((a) => [a.id, a])), [avtomati]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => {
      const hrb = r.hrbtisce_id ? hrbMap.get(r.hrbtisce_id) : null;
      const pa = r.pljucni_avtomat_id ? paMap.get(r.pljucni_avtomat_id) : null;
      return (
        (r.vozilo ?? "").toLowerCase().includes(q) ||
        (hrb?.serijska_st ?? "").toLowerCase().includes(q) ||
        (hrb?.interna_st ?? "").toLowerCase().includes(q) ||
        (pa?.serijska_st ?? "").toLowerCase().includes(q) ||
        (pa?.naziv ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, hrbMap, paMap]);

  const openCreate = () => {
    setEditing(null);
    setForm({ vozilo: "", hrbtisce_id: "", pljucni_avtomat_id: "" });
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({
      vozilo: row.vozilo ?? "",
      hrbtisce_id: row.hrbtisce_id ?? "",
      pljucni_avtomat_id: row.pljucni_avtomat_id ?? "",
    });
    setOpen(true);
  };

  const handleDelete = async (row: Row) => {
    if (!confirm("Ali res želiš izbrisati ta zapis?")) return;
    const { error } = await supabase.from("ida_vozila").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Izbrisano" });
      load();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      vozilo: form.vozilo.trim() || null,
      hrbtisce_id: form.hrbtisce_id || null,
      pljucni_avtomat_id: form.pljucni_avtomat_id || null,
    };

    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("ida_vozila").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) {
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("ida_vozila").insert({ ...payload, user_id: user.id });
      setSaving(false);
      if (error) {
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Shranjeno" });
    }
    setOpen(false);
    load();
  };

  const hrbLabel = (h: Hrb) => h.serijska_st ? `${h.serijska_st} (${h.interna_st})` : h.interna_st;
  const paLabel = (a: PA) => a.serijska_st ? `${a.serijska_st}${a.naziv ? ` (${a.naziv})` : ""}` : (a.naziv ?? "—");

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/ida"><ArrowLeft className="h-4 w-4 mr-1" /> IDA</Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Seznam IDA po vozilih</h1>
          </div>
          {allowed && (
            <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Plus className="h-4 w-4 mr-1" /> Dodaj nov zapis
            </Button>
          )}
        </div>

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Nimaš pravic za urejanje. Zapise lahko samo pregleduješ.
          </div>
        )}

        <Input
          placeholder="Išči..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Vozilo</TableHead>
                <TableHead>Hrbtišče (serijska št.)</TableHead>
                <TableHead>Pljučni avtomat (serijska št.)</TableHead>
                {allowed && <TableHead className="text-right w-[120px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3 + (allowed ? 1 : 0)} className="text-center text-muted-foreground py-8">
                    Nalagam...
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3 + (allowed ? 1 : 0)} className="text-center text-muted-foreground py-8">
                    Ni zapisov
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => {
                  const hrb = r.hrbtisce_id ? hrbMap.get(r.hrbtisce_id) : null;
                  const pa = r.pljucni_avtomat_id ? paMap.get(r.pljucni_avtomat_id) : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.vozilo || "—"}</TableCell>
                      <TableCell>{hrb ? hrbLabel(hrb) : "—"}</TableCell>
                      <TableCell>{pa ? paLabel(pa) : "—"}</TableCell>
                      {allowed && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Uredi">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} aria-label="Izbriši">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Uredi zapis" : "Nov zapis"} — Seznam IDA po vozilih</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="vozilo">Vozilo</Label>
                  <Select
                    value={form.vozilo || NONE}
                    onValueChange={(v) => setForm((p) => ({ ...p, vozilo: v === NONE ? "" : v }))}
                  >
                    <SelectTrigger id="vozilo">
                      <SelectValue placeholder="Izberi vozilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {vehicles.map((veh) => (
                        <SelectItem key={veh.id} value={veh.oznaka}>
                          {veh.oznaka}{veh.znamka ? ` — ${veh.znamka}${veh.model ? ` ${veh.model}` : ""}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hrbtisce">Hrbtišče (serijska št.)</Label>
                  <Select
                    value={form.hrbtisce_id || NONE}
                    onValueChange={(v) => setForm((p) => ({ ...p, hrbtisce_id: v === NONE ? "" : v }))}
                  >
                    <SelectTrigger id="hrbtisce">
                      <SelectValue placeholder="Izberi hrbtišče" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {hrbtisca.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{hrbLabel(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pa">Pljučni avtomat (serijska št.)</Label>
                  <Select
                    value={form.pljucni_avtomat_id || NONE}
                    onValueChange={(v) => setForm((p) => ({ ...p, pljucni_avtomat_id: v === NONE ? "" : v }))}
                  >
                    <SelectTrigger id="pa">
                      <SelectValue placeholder="Izberi pljučni avtomat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {avtomati.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{paLabel(a)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Prekliči
                </Button>
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
