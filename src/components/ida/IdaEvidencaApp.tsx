import { useEffect, useState, useMemo } from "react";
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
import AppShell from "@/components/AppShell";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Lock, Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export type IdaFieldType = "text" | "number" | "year" | "month" | "select" | "textarea";

export interface IdaField {
  key: string;
  label: string;
  type: IdaFieldType;
  required?: boolean;
  options?: string[]; // for select
  placeholder?: string;
  suffix?: string; // e.g. "L", "bar"
}

interface IdaEvidencaAppProps {
  title: string;
  table: "ida_maske" | "ida_hrbtisca" | "ida_tlacne_posode" | "ida_pljucni_avtomati";
  fields: IdaField[];
  primaryKey: string; // field shown as primary identifier in table
}

type Row = Record<string, unknown> & { id: string; user_id: string };

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - i);
const MONTHS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
];

export default function IdaEvidencaApp({ title, table, fields, primaryKey }: IdaEvidencaAppProps) {
  const { user } = useAuth();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("ida");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      fields.some((f) => String(r[f.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, search, fields]);

  const openCreate = () => {
    setEditing(null);
    const blank: Record<string, string> = {};
    fields.forEach((f) => (blank[f.key] = ""));
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const f: Record<string, string> = {};
    fields.forEach((field) => {
      const v = row[field.key];
      f[field.key] = v === null || v === undefined ? "" : String(v);
    });
    setForm(f);
    setOpen(true);
  };

  const handleDelete = async (row: Row) => {
    if (!confirm("Ali res želiš izbrisati ta zapis?")) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
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

    for (const f of fields) {
      if (f.required && !form[f.key]?.trim()) {
        toast({ title: "Manjkajoči podatki", description: `Polje "${f.label}" je obvezno.`, variant: "destructive" });
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      const raw = form[f.key]?.trim();
      if (raw === "" || raw === undefined) {
        payload[f.key] = null;
      } else if (f.type === "number" || f.type === "year") {
        const n = Number(raw);
        payload[f.key] = isNaN(n) ? null : n;
      } else {
        payload[f.key] = raw;
      }
    });

    setSaving(true);
    if (editing) {
      const { error } = await supabase.from(table).update(payload as never).eq("id", editing.id);
      setSaving(false);
      if (error) {
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Posodobljeno" });
    } else {
      payload.user_id = user.id;
      const { error } = await supabase.from(table).insert(payload as never);
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

  const renderField = (f: IdaField) => {
    const val = form[f.key] ?? "";
    const setVal = (v: string) => setForm((p) => ({ ...p, [f.key]: v }));

    if (f.type === "textarea") {
      return (
        <Textarea
          id={f.key}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={f.placeholder}
          rows={3}
        />
      );
    }
    if (f.type === "year") {
      return (
        <Select value={val} onValueChange={setVal}>
          <SelectTrigger id={f.key}>
            <SelectValue placeholder="Izberi leto" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === "month") {
      // Use native month input — returns YYYY-MM
      return (
        <Input
          id={f.key}
          type="month"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    }
    if (f.type === "select") {
      return (
        <Select value={val} onValueChange={setVal}>
          <SelectTrigger id={f.key}>
            <SelectValue placeholder={f.placeholder ?? "Izberi"} />
          </SelectTrigger>
          <SelectContent>
            {(f.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === "number") {
      return (
        <div className="relative">
          <Input
            id={f.key}
            type="number"
            step="any"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={f.placeholder}
          />
          {f.suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{f.suffix}</span>
          )}
        </div>
      );
    }
    return (
      <Input
        id={f.key}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={f.placeholder}
      />
    );
  };

  const formatCell = (f: IdaField, v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/ida"><ArrowLeft className="h-4 w-4 mr-1" /> IDA</Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
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
                {fields.map((f) => (
                  <TableHead key={f.key} className={f.key === primaryKey ? "font-semibold" : undefined}>
                    {f.label}
                  </TableHead>
                ))}
                {allowed && <TableHead className="text-right w-[120px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={fields.length + (allowed ? 1 : 0)} className="text-center text-muted-foreground py-8">
                    Nalagam...
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={fields.length + (allowed ? 1 : 0)} className="text-center text-muted-foreground py-8">
                    Ni zapisov
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    {fields.map((f) => (
                      <TableCell key={f.key} className={f.key === primaryKey ? "font-medium" : undefined}>
                        {formatCell(f, r[f.key])}
                        {f.suffix && r[f.key] !== null && r[f.key] !== undefined && r[f.key] !== "" ? ` ${f.suffix}` : ""}
                      </TableCell>
                    ))}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Uredi zapis" : "Nov zapis"} — {title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                    <Label htmlFor={f.key}>
                      {f.label}
                      {f.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    {renderField(f)}
                  </div>
                ))}
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