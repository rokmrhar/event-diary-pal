import { useEffect, useMemo, useState } from "react";
import { Lock, Pencil, Plus, Stethoscope, Trash2, CalendarPlus } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { DatePickerSI } from "@/components/ui/date-picker-si";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { formatDateSI } from "@/lib/format";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import MedicalPlansTab from "@/components/medical/MedicalPlansTab";

type Row = {
  id: string;
  user_id: string;
  member_name: string;
  zadnji_pregled: string | null;
  naslednji_pregled: string | null;
  opombe: string | null;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / 86400000);
}

function statusBadge(days: number | null) {
  if (days === null) return <Badge variant="outline">—</Badge>;
  if (days < 0) return <Badge variant="destructive">Pretečeno ({Math.abs(days)} dni)</Badge>;
  if (days <= 14) return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">{days} dni</Badge>;
  return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">{days} dni</Badge>;
}

export default function ZdravniskiPregledi() {
  const { user, isAdmin } = useAuth();
  const { members } = useMembers();
  const { canEdit } = useModulePermissions();
  const canView = isAdmin || canEdit("medical_view") || canEdit("medical_edit");
  const allowed = isAdmin || canEdit("medical_edit");

  if (!canView) {
    return (
      <AppShell>
        <div className="p-6 max-w-3xl mx-auto">
          <PageHeader title="Zdravniški pregledi" icon={Stethoscope} />
          <div className="mt-6 p-6 border border-border rounded-xl bg-muted/40 text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" /> Za ogled tega modula nimate pravic.
          </div>
        </div>
      </AppShell>
    );
  }

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ member_name: "", zadnji_pregled: "", naslednji_pregled: "", opombe: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("medical_checks")
      .select("id, user_id, member_name, zadnji_pregled, naslednji_pregled, opombe")
      .order("naslednji_pregled", { ascending: true, nullsFirst: false });
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => r.member_name.toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ member_name: "", zadnji_pregled: "", naslednji_pregled: "", opombe: "" });
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({
      member_name: row.member_name,
      zadnji_pregled: row.zadnji_pregled ?? "",
      naslednji_pregled: row.naslednji_pregled ?? "",
      opombe: row.opombe ?? "",
    });
    setOpen(true);
  };

  const handleDelete = async (row: Row) => {
    if (!confirm("Ali res želiš izbrisati ta zapis?")) return;
    const { error } = await supabase.from("medical_checks").delete().eq("id", row.id);
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    else { toast({ title: "Izbrisano" }); load(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.member_name.trim()) {
      toast({ title: "Manjka ime", description: "Izberi gasilca", variant: "destructive" });
      return;
    }
    const payload = {
      member_name: form.member_name.trim(),
      zadnji_pregled: form.zadnji_pregled || null,
      naslednji_pregled: form.naslednji_pregled || null,
      opombe: form.opombe.trim() || null,
    };
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("medical_checks").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("medical_checks").insert({ ...payload, user_id: user.id });
      setSaving(false);
      if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
      toast({ title: "Shranjeno" });
    }
    setOpen(false);
    load();
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="Zdravniški pregledi"
          icon={Stethoscope}
        />

        <Tabs defaultValue="evidenca" className="w-full">
          <TabsList>
            <TabsTrigger value="evidenca"><Stethoscope className="h-3.5 w-3.5 mr-1" /> Zdravniški pregledi</TabsTrigger>
            <TabsTrigger value="nacrt"><CalendarPlus className="h-3.5 w-3.5 mr-1" /> Načrtovanje</TabsTrigger>
          </TabsList>

          <TabsContent value="evidenca" className="mt-4 space-y-4">
            {allowed && (
              <div className="flex justify-end">
                <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Dodaj zapis
                </Button>
              </div>
            )}

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Zapise lahko ureja samo admin.
          </div>
        )}

        <Input
          placeholder="Išči po imenu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Ime in priimek</TableHead>
                <TableHead>Zadnji pregled</TableHead>
                <TableHead>Naslednji pregled</TableHead>
                <TableHead>Dni do preteka</TableHead>
                <TableHead>Opombe</TableHead>
                {allowed && <TableHead className="text-right w-[120px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5 + (allowed ? 1 : 0)} className="text-center text-muted-foreground py-8">Nalagam...</TableCell></TableRow>
              ) : visible.length === 0 ? (
                <TableRow><TableCell colSpan={5 + (allowed ? 1 : 0)} className="text-center text-muted-foreground py-8">Ni zapisov</TableCell></TableRow>
              ) : (
                visible.map((r) => {
                  const dni = daysUntil(r.naslednji_pregled);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.member_name}</TableCell>
                      <TableCell>{r.zadnji_pregled ? formatDateSI(r.zadnji_pregled) : "—"}</TableCell>
                      <TableCell>{r.naslednji_pregled ? formatDateSI(r.naslednji_pregled) : "—"}</TableCell>
                      <TableCell>{statusBadge(dni)}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground text-sm">{r.opombe || "—"}</TableCell>
                      {allowed && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Uredi"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} aria-label="Izbriši"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          </TabsContent>

          <TabsContent value="nacrt" className="mt-4">
            <MedicalPlansTab rows={rows} canEdit={allowed} />
          </TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Uredi zapis" : "Nov zapis"} — Zdravniški pregled</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="member">Ime in priimek</Label>
                <Select value={form.member_name} onValueChange={(v) => setForm((p) => ({ ...p, member_name: v }))}>
                  <SelectTrigger id="member"><SelectValue placeholder="Izberi gasilca" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Zadnji zdravniški pregled</Label>
                  <DatePickerSI value={form.zadnji_pregled} onChange={(v) => setForm((p) => ({ ...p, zadnji_pregled: v }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Naslednji zdravniški pregled</Label>
                  <DatePickerSI value={form.naslednji_pregled} onChange={(v) => setForm((p) => ({ ...p, naslednji_pregled: v }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opombe">Opombe</Label>
                <Textarea id="opombe" rows={3} value={form.opombe} onChange={(e) => setForm((p) => ({ ...p, opombe: e.target.value }))} />
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