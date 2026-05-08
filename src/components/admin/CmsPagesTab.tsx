import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  content_type: "html" | "text";
  visible: boolean;
  sort_order: number;
};

const empty: Omit<Page, "id"> = {
  slug: "", title: "", content: "", content_type: "html", visible: true, sort_order: 0,
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/č/g, "c").replace(/š/g, "s").replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CmsPagesTab() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState<Omit<Page, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cms_pages").select("*")
      .order("sort_order").order("title");
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    setPages((data as Page[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Page) => {
    setEditing(p);
    setForm({
      slug: p.slug, title: p.title, content: p.content,
      content_type: p.content_type, visible: p.visible, sort_order: p.sort_order,
    });
    setOpen(true);
  };

  const onTitleChange = (v: string) => {
    setForm((p) => ({
      ...p, title: v,
      slug: !editing && (!p.slug || p.slug === slugify(p.title)) ? slugify(v) : p.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Manjkajo podatki", description: "Naslov in pot sta obvezna.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, slug: slugify(form.slug) };
    const { error } = editing
      ? await supabase.from("cms_pages").update(payload).eq("id", editing.id)
      : await supabase.from("cms_pages").insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: editing ? "Posodobljeno" : "Shranjeno" });
    setOpen(false); load();
  };

  const handleDelete = async (p: Page) => {
    if (!confirm(`Izbriši stran "${p.title}"?`)) return;
    const { error } = await supabase.from("cms_pages").delete().eq("id", p.id);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Izbrisano" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">CMS – Strani</h2>
          <p className="text-sm text-muted-foreground">
            Ustvari poljubne strani z besedilom ali HTML/CSS kodo. Dosegljive na <code>/p/&lt;pot&gt;</code>.
            Strani lahko povežeš v levem meniju (zavihek »Meni«) z URL-jem <code>/p/&lt;pot&gt;</code>.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
          <Plus className="h-4 w-4 mr-1" /> Nova stran
        </Button>
      </div>

      <div className="overflow-x-auto border border-border rounded-xl bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naslov</TableHead>
              <TableHead>Pot</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Vidno</TableHead>
              <TableHead className="text-right w-[160px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nalagam...</TableCell></TableRow>
            ) : pages.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Ni strani</TableCell></TableRow>
            ) : pages.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell><code className="text-xs">/p/{p.slug}</code></TableCell>
                <TableCell className="text-xs uppercase text-muted-foreground">{p.content_type}</TableCell>
                <TableCell>{p.visible ? "Da" : "Ne"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild size="icon" variant="ghost" aria-label="Odpri">
                      <Link to={`/p/${p.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Uredi"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p)} aria-label="Izbriši"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi stran" : "Nova stran"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Naslov</Label>
                <Input id="title" value={form.title} onChange={(e) => onTitleChange(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Pot (slug)</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Tip vsebine</Label>
                <Select value={form.content_type} onValueChange={(v: "html" | "text") => setForm((p) => ({ ...p, content_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML / koda</SelectItem>
                    <SelectItem value="text">Navadno besedilo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sort">Vrstni red</Label>
                <Input id="sort" type="number" value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-end gap-2">
                <Switch id="vis" checked={form.visible}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, visible: v }))} />
                <Label htmlFor="vis">Vidno</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Vsebina ({form.content_type === "html" ? "HTML/CSS koda dovoljena" : "navadno besedilo"})</Label>
              <Textarea id="content" rows={14} value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                className="font-mono text-xs" />
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
  );
}